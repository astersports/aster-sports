-- Wave 4.8 6c Session 1 — comms_messages.expires_at + backfill.
--
-- The Active queue today accumulates drafts forever. There is no auto-expire,
-- which is why 35 draft rows are surfacing in production (weekly_digest test
-- artifacts from 5/11, Wave 4.3-E zombies, plus 5 real game_recap drafts).
-- Session 6a audit Area 7 recommended adding expires_at as the durable fix.
--
-- This migration:
--   1) Adds expires_at TIMESTAMPTZ NULL column to comms_messages.
--   2) Backfills existing drafts with kind-scoped windows. Some land in past
--      → next sweep run (added in PR #120) archives them. Future drafts get
--      stamped at INSERT by the auto-draft tick (PR #118).
--
-- Per-kind windows mirror the synthetic surface windows from
-- src/lib/briefings/needsAttention.js (game_recap 14d / tournament_prelim
-- until start / tournament_recap 30d / schedule_change 7d) plus reasonable
-- defaults for the rest. Orphans (anchor_id points to a deleted parent)
-- fall back to last_edited_at + window via COALESCE in the case branch.
-- Rows with NULL last_edited_at (2 zombie weekly_digest drafts predating
-- column NOT-NULL) fall back to NOW() - 14d, so short-window kinds land
-- in the past and get swept on first cron run.

BEGIN;

-- 1. Schema change
ALTER TABLE public.comms_messages
  ADD COLUMN expires_at TIMESTAMPTZ;

COMMENT ON COLUMN public.comms_messages.expires_at IS
  'When this draft auto-expires from the Active queue. NULL = no expiry. '
  'Set at draft creation by the auto-draft tick based on kind + anchor_time. '
  'Sweep handler in briefing-auto-draft-tick archives drafts where '
  'expires_at < NOW().';

-- 2. Backfill existing drafts. Single UPDATE with CASE-on-kind, using
--    correlated subqueries for anchor lookups (cannot UPDATE-FROM target).
--    The COALESCE(last_edited_at, NOW() - 14d) wrapper handles the 2
--    pre-existing weekly_digest drafts where last_edited_at is NULL.
UPDATE public.comms_messages cm
SET expires_at = CASE cm.kind
  WHEN 'game_recap' THEN COALESCE(
    (SELECT e.start_at FROM public.events e WHERE e.id = cm.anchor_id),
    COALESCE(cm.last_edited_at, NOW() - INTERVAL '14 days')
  ) + INTERVAL '14 days'

  WHEN 'tournament_prelim' THEN COALESCE(
    (SELECT (t.start_date::text || ' 00:00:00 America/New_York')::timestamptz
       FROM public.tournaments t WHERE t.id = cm.anchor_id),
    COALESCE(cm.last_edited_at, NOW() - INTERVAL '14 days') + INTERVAL '14 days'
  )

  WHEN 'tournament_recap' THEN COALESCE(
    (SELECT (t.end_date::text || ' 23:59:59 America/New_York')::timestamptz + INTERVAL '30 days'
       FROM public.tournaments t WHERE t.id = cm.anchor_id),
    COALESCE(cm.last_edited_at, NOW() - INTERVAL '14 days') + INTERVAL '30 days'
  )

  WHEN 'schedule_change' THEN COALESCE(cm.last_edited_at, NOW() - INTERVAL '14 days') + INTERVAL '7 days'
  WHEN 'weekly_digest'   THEN COALESCE(cm.last_edited_at, NOW() - INTERVAL '14 days') + INTERVAL '7 days'
  WHEN 'announcement'    THEN COALESCE(cm.last_edited_at, NOW() - INTERVAL '14 days') + INTERVAL '30 days'

  WHEN 'rsvp_nudge' THEN COALESCE(
    (SELECT e.start_at FROM public.events e WHERE e.id = cm.anchor_id),
    COALESCE(cm.last_edited_at, NOW() - INTERVAL '14 days') + INTERVAL '3 days'
  )

  WHEN 'custom_message'        THEN COALESCE(cm.last_edited_at, NOW() - INTERVAL '14 days') + INTERVAL '30 days'
  WHEN 'academy_callup_notice' THEN COALESCE(cm.last_edited_at, NOW() - INTERVAL '14 days') + INTERVAL '7 days'
  ELSE                              COALESCE(cm.last_edited_at, NOW() - INTERVAL '14 days') + INTERVAL '14 days'
END
WHERE cm.status = 'draft';

-- 3. Post-condition verification — abort if anything is off
DO $$
DECLARE
  v_total_drafts INTEGER;
  v_drafts_with_expiry INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_total_drafts
  FROM public.comms_messages WHERE status = 'draft';

  SELECT COUNT(*) INTO v_drafts_with_expiry
  FROM public.comms_messages WHERE status = 'draft' AND expires_at IS NOT NULL;

  IF v_drafts_with_expiry != v_total_drafts THEN
    RAISE EXCEPTION 'Backfill incomplete: % of % drafts got expires_at',
      v_drafts_with_expiry, v_total_drafts;
  END IF;

  RAISE NOTICE 'expires_at backfilled on % of % drafts',
    v_drafts_with_expiry, v_total_drafts;
END $$;

COMMIT;

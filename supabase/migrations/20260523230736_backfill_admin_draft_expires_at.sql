-- §4.AI Option C PR D — backfill expires_at on admin-created drafts.
--
-- Context: the original Wave 4.8 6c migration (20260512162843_wave_4_8_6c_1
-- _comms_messages_expires_at.sql) backfilled all drafts at the time it
-- shipped, but only cron-created drafts get expires_at stamped at INSERT
-- going forward. Admin drafts created via useBriefingDraft.js between
-- 2026-05-12 and 2026-05-23 have expires_at = NULL and are never swept.
--
-- PR D fixes the INSERT path in useBriefingDraft.js to set expires_at via
-- computeExpiryForKind. This migration backfills the orphans created
-- during the gap window using the same CASE-on-kind logic as the
-- original Wave 4.8 6c migration so the auto-draft tick can archive them
-- on its next run.

BEGIN;

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
WHERE cm.status = 'draft' AND cm.expires_at IS NULL;

-- Post-condition verification: no draft should still have NULL expires_at.
DO $$
DECLARE
  v_remaining INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_remaining
  FROM public.comms_messages
  WHERE status = 'draft' AND expires_at IS NULL;

  IF v_remaining > 0 THEN
    RAISE EXCEPTION 'Backfill incomplete: % drafts still have NULL expires_at', v_remaining;
  END IF;

  RAISE NOTICE '§4.AI Option C PR D: admin-draft expires_at backfill complete';
END $$;

COMMIT;

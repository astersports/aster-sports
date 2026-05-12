-- Wave 4.8 6c Session 2 — briefing_active_queue RPC.
--
-- Unifies the Active queue source into a single SECURITY DEFINER function
-- that returns BOTH:
--   (a) draft + scheduled comms_messages rows (non-expired)
--   (b) synthetic "needs briefing" rows for past games + upcoming/past
--       tournaments where no comms_messages row exists yet
--
-- Replaces the client-side merge of useInboxQueue (db drafts) and
-- useNeedsBriefing (5 synth sub-streams). PR #119 will rewrite the hook
-- to call this RPC; useNeedsBriefing.js will be deleted in that PR.
--
-- v1 scope per 6c Step 2 decisions:
--   D1a — synth windows match needsAttention.js: game_recap 14d past,
--         tournament_prelim 14d ahead, tournament_recap 30d past.
--   D2b-minus-user_id — params (p_org_id, p_kind, p_team_ids, p_date_range).
--   D3a — synth only surfaces anchors with ZERO non-sent comms_messages
--         rows; archived/expired drafts do NOT resurface (they fell off
--         the queue intentionally per D1c hard miss-it deadline).
--
-- Synthetic surfaces NOT included in v1 (deferred to PR #119+):
--   - schedule_change (needs event_change_audit JOIN with dispatch_email_id
--     filter; complex)
--   - rsvp_nudge (needs RSVP coverage calculation per nudge_rules threshold)
--   - weekly_digest_due (needs period detection vs Sunday 8AM window)
-- Rationale: those three have reliable auto-draft handlers. The DB-backed
-- branch of the RPC will surface their drafts. Synth fallback for them
-- is purely a safety net and can stay client-side until we observe
-- enough cron telemetry to drop synth entirely.

CREATE OR REPLACE FUNCTION public.briefing_active_queue(
  p_org_id     uuid,
  p_kind       text     DEFAULT NULL,
  p_team_ids   uuid[]   DEFAULT NULL,
  p_date_range text     DEFAULT 'last_14_days'
)
RETURNS TABLE (
  id           uuid,                       -- NULL for synthetic rows
  source       text,                       -- 'comms_messages' | 'synthetic'
  kind         text,
  anchor_kind  text,
  anchor_id    uuid,
  status       text,                       -- 'draft'|'scheduled'|'needs_briefing'
  team_id      uuid,                       -- NULL for tournament rows
  team_name    text,                       -- NULL for tournament rows
  title_text   text,                       -- subject (drafts) or computed (synth)
  anchor_time  timestamptz,                -- last_edited_at or anchor's relevant time
  expires_at   timestamptz                 -- nullable
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_range_start timestamptz;
  v_range_end   timestamptz;
BEGIN
  IF p_date_range = 'all' THEN
    v_range_start := NULL;
    v_range_end   := NULL;
  ELSIF p_date_range = 'this_week' THEN
    v_range_start := date_trunc('week', NOW() AT TIME ZONE 'America/New_York')
                       AT TIME ZONE 'America/New_York';
    v_range_end   := v_range_start + INTERVAL '7 days';
  ELSIF p_date_range = 'last_30_days' THEN
    v_range_start := NOW() - INTERVAL '30 days';
    v_range_end   := NOW() + INTERVAL '30 days';
  ELSE  -- 'last_14_days' default
    v_range_start := NOW() - INTERVAL '14 days';
    v_range_end   := NOW() + INTERVAL '14 days';
  END IF;

  RETURN QUERY
  -- Branch A: existing draft + scheduled rows (non-expired)
  SELECT
    cm.id,
    'comms_messages'::text AS source,
    cm.kind,
    cm.anchor_kind,
    cm.anchor_id,
    cm.status,
    cm.team_id,
    t.name AS team_name,
    cm.subject AS title_text,
    COALESCE(
      CASE cm.anchor_kind
        WHEN 'event'      THEN (SELECT e.start_at  FROM events e      WHERE e.id = cm.anchor_id)
        WHEN 'tournament' THEN
          CASE
            WHEN cm.kind = 'tournament_recap'
              THEN (SELECT (tr.end_date + INTERVAL '1 day')::timestamptz FROM tournaments tr WHERE tr.id = cm.anchor_id)
            ELSE (SELECT tr.start_date::timestamptz FROM tournaments tr WHERE tr.id = cm.anchor_id)
          END
        ELSE NULL
      END,
      cm.last_edited_at
    ) AS anchor_time,
    cm.expires_at
  FROM comms_messages cm
  LEFT JOIN teams t ON t.id = cm.team_id
  WHERE cm.org_id = p_org_id
    AND cm.status IN ('draft','scheduled')
    AND (cm.expires_at IS NULL OR cm.expires_at > NOW())
    AND (p_kind IS NULL OR cm.kind = p_kind)
    AND (p_team_ids IS NULL OR cm.team_id = ANY(p_team_ids)
      OR (cm.anchor_kind = 'tournament' AND EXISTS (
        SELECT 1 FROM tournament_teams tt
        WHERE tt.tournament_id = cm.anchor_id AND tt.team_id = ANY(p_team_ids)
      ))
    )

  UNION ALL

  -- Branch B1: synthetic game_recap (past games within 14d)
  SELECT
    NULL::uuid AS id,
    'synthetic'::text AS source,
    'game_recap'::text AS kind,
    'event'::text AS anchor_kind,
    e.id AS anchor_id,
    'needs_briefing'::text AS status,
    e.team_id,
    t.name AS team_name,
    COALESCE(NULLIF(e.title, ''), 'vs ' || COALESCE(e.opponent, 'opponent')) AS title_text,
    e.start_at AS anchor_time,
    (e.start_at + INTERVAL '14 days') AS expires_at
  FROM events e
  JOIN teams t ON t.id = e.team_id
  WHERE t.org_id = p_org_id
    AND e.event_type = 'game'
    AND e.start_at >= (NOW() - INTERVAL '14 days')
    AND e.start_at <  NOW()
    AND (e.status IS NULL OR e.status != 'cancelled')
    AND (e.is_bracket_placeholder IS NULL OR e.is_bracket_placeholder = false)
    AND NOT EXISTS (
      SELECT 1 FROM comms_messages cm2
      WHERE cm2.org_id = p_org_id
        AND cm2.kind = 'game_recap'
        AND cm2.anchor_kind = 'event'
        AND cm2.anchor_id = e.id
        AND cm2.status IN ('draft','scheduled','queued','sent','archived')
    )
    AND (p_kind IS NULL OR p_kind = 'game_recap')
    AND (p_team_ids IS NULL OR e.team_id = ANY(p_team_ids))

  UNION ALL

  -- Branch B2: synthetic tournament_prelim (upcoming within 14d)
  SELECT
    NULL::uuid AS id,
    'synthetic'::text AS source,
    'tournament_prelim'::text AS kind,
    'tournament'::text AS anchor_kind,
    tr.id AS anchor_id,
    'needs_briefing'::text AS status,
    NULL::uuid AS team_id,
    NULL::text AS team_name,
    tr.name AS title_text,
    tr.start_date::timestamptz AS anchor_time,
    tr.start_date::timestamptz AS expires_at
  FROM tournaments tr
  WHERE tr.org_id = p_org_id
    AND tr.start_date >= CURRENT_DATE
    AND tr.start_date <= (CURRENT_DATE + INTERVAL '14 days')
    AND NOT EXISTS (
      SELECT 1 FROM comms_messages cm2
      WHERE cm2.org_id = p_org_id
        AND cm2.kind = 'tournament_prelim'
        AND cm2.anchor_kind = 'tournament'
        AND cm2.anchor_id = tr.id
        AND cm2.status IN ('draft','scheduled','queued','sent','archived')
    )
    AND (p_kind IS NULL OR p_kind = 'tournament_prelim')
    AND (p_team_ids IS NULL OR EXISTS (
      SELECT 1 FROM tournament_teams tt
      WHERE tt.tournament_id = tr.id AND tt.team_id = ANY(p_team_ids)
    ))

  UNION ALL

  -- Branch B3: synthetic tournament_recap (past within 30d)
  SELECT
    NULL::uuid AS id,
    'synthetic'::text AS source,
    'tournament_recap'::text AS kind,
    'tournament'::text AS anchor_kind,
    tr.id AS anchor_id,
    'needs_briefing'::text AS status,
    NULL::uuid AS team_id,
    NULL::text AS team_name,
    tr.name AS title_text,
    (tr.end_date + INTERVAL '1 day')::timestamptz AS anchor_time,
    ((tr.end_date + INTERVAL '1 day')::timestamptz + INTERVAL '30 days') AS expires_at
  FROM tournaments tr
  WHERE tr.org_id = p_org_id
    AND tr.end_date >= (CURRENT_DATE - INTERVAL '30 days')
    AND tr.end_date <  CURRENT_DATE
    AND NOT EXISTS (
      SELECT 1 FROM comms_messages cm2
      WHERE cm2.org_id = p_org_id
        AND cm2.kind = 'tournament_recap'
        AND cm2.anchor_kind = 'tournament'
        AND cm2.anchor_id = tr.id
        AND cm2.status IN ('draft','scheduled','queued','sent','archived')
    )
    AND (p_kind IS NULL OR p_kind = 'tournament_recap')
    AND (p_team_ids IS NULL OR EXISTS (
      SELECT 1 FROM tournament_teams tt
      WHERE tt.tournament_id = tr.id AND tt.team_id = ANY(p_team_ids)
    ))
  ;
END;
$$;

GRANT EXECUTE ON FUNCTION public.briefing_active_queue(uuid, text, uuid[], text) TO authenticated;

COMMENT ON FUNCTION public.briefing_active_queue(uuid, text, uuid[], text) IS
  'Wave 4.8 6c — unified Active queue for briefings. Returns DB-backed '
  'drafts/scheduled (non-expired) UNION synthetic needs-briefing rows for '
  'past games + upcoming tournaments + past tournaments. Replaces the '
  'client-side merge of useInboxQueue + useNeedsBriefing (PR #119).';

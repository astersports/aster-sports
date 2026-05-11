-- Wave 4.3-J — get_digest_recipients per-team synthetic recipients.
-- Applied via chat-side Supabase MCP 2026-05-11 12:33:31 UTC.
--
-- Mirror file per anti-pattern #21 (split-of-labor: chat applies, CC mirrors).
-- Function body recovered via pg_get_functiondef post-apply.
--
-- Builds on 4.3-I (single synthetic row) by emitting one synthetic row per
-- team when override is set. Send pipeline iterates naturally: admin@
-- receives N emails (one per team), each scoped to that team's events.
-- Easier visual QA across all teams in a single send.
--
-- Invariants verified by chat-side post-flight:
--   1. p_pilot_only=TRUE + override set  → 5 synthetic rows (one per team)
--   2. Each synthetic row team_ids_len=1 (single-team scope)
--   3. full_name = 'Pilot Test · <team_name>' for easy inbox distinction
--   4. p_pilot_only=FALSE                 → 102 real guardians (regression)

CREATE OR REPLACE FUNCTION public.get_digest_recipients(
  p_org_id uuid,
  p_pilot_only boolean DEFAULT FALSE
)
RETURNS TABLE (
  guardian_id uuid,
  email text,
  full_name text,
  team_ids uuid[],
  team_names text[]
)
LANGUAGE sql STABLE
SET search_path = 'public', 'pg_catalog'
AS $$
  WITH override AS (
    SELECT pilot_test_recipient_email
    FROM organization_settings
    WHERE organization_id = p_org_id
      AND p_pilot_only = TRUE
      AND pilot_test_recipient_email IS NOT NULL
  ),
  synthetic AS (
    -- Per-team synthetic rows: one row per team, each with team_ids=[that team].
    -- CROSS JOIN with override → only emits rows when override is in effect.
    -- full_name suffixes team name so admin@ inbox shows "Pilot Test · 11U Girls",
    -- "Pilot Test · 10U Black", etc. for easy distinction across the N emails.
    SELECT
      NULL::uuid AS guardian_id,
      o.pilot_test_recipient_email AS email,
      'Pilot Test · ' || t.name AS full_name,
      ARRAY[t.id]::uuid[] AS team_ids,
      ARRAY[t.name]::text[] AS team_names
    FROM override o
    CROSS JOIN public.teams t
    WHERE t.org_id = p_org_id
  ),
  real_guardians AS (
    SELECT
      g.id AS guardian_id,
      g.email,
      TRIM(CONCAT_WS(' ', g.first_name, g.last_name)) AS full_name,
      array_agg(DISTINCT tp.team_id) AS team_ids,
      array_agg(DISTINCT tm.name) AS team_names
    FROM public.guardians g
    JOIN public.player_guardians pg ON pg.guardian_id = g.id
    JOIN public.team_players tp ON tp.player_id = pg.player_id
    JOIN public.teams tm ON tm.id = tp.team_id
    WHERE g.org_id = p_org_id
      AND g.email IS NOT NULL
      AND tp.status = 'active'
      AND tm.org_id = p_org_id
      AND (p_pilot_only = FALSE OR g.is_pilot_family = TRUE)
      AND NOT EXISTS (SELECT 1 FROM override)
    GROUP BY g.id, g.email, g.first_name, g.last_name
  )
  SELECT * FROM synthetic
  UNION ALL
  SELECT * FROM real_guardians
  ORDER BY full_name NULLS LAST, email NULLS LAST;
$$;

REVOKE EXECUTE ON FUNCTION public.get_digest_recipients(uuid, boolean) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_digest_recipients(uuid, boolean) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_digest_recipients(uuid, boolean) TO authenticated;

-- Verification: 5 synthetic rows when override set + pilot_only=true (LH has 5 teams).
DO $$
DECLARE
  v_count int;
  v_distinct_teams int;
BEGIN
  SELECT COUNT(*), COUNT(DISTINCT team_ids[1]) INTO v_count, v_distinct_teams
  FROM public.get_digest_recipients(
    'e3e95e21-3571-4e9a-985a-d5d01480d4a6'::uuid,
    TRUE
  )
  WHERE guardian_id IS NULL;
  IF v_count != 5 OR v_distinct_teams != 5 THEN
    RAISE EXCEPTION 'per-team synthetic verification failed: count=%, distinct_teams=%', v_count, v_distinct_teams;
  END IF;
  RAISE NOTICE 'wave 4.3-J per-team synthetic verified: % rows across % teams', v_count, v_distinct_teams;
END $$;

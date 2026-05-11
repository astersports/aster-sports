-- Wave 4.3-I — get_digest_recipients with pilot_test_recipient_email override.
-- Applied via chat-side Supabase MCP 2026-05-11 12:21:18 UTC.
--
-- Mirror file per anti-pattern #21 (split-of-labor: chat applies, CC mirrors).
--
-- Replaces the rewrite from migration 20260509101739 (wave 4.2
-- pilot_mode_infrastructure). Adds synthetic-row override via
-- pilot_test_recipient_email column (column added in
-- 20260511115858_wave_4_3_i_pilot_test_recipient_email).
--
-- Invariants verified post-apply via execute_sql:
--   1. p_pilot_only=TRUE + override set  → 1 synthetic row (guardian_id=NULL)
--   2. p_pilot_only=FALSE                → 102 real guardians (regression)
--   3. Synthetic team_ids count          → 5 (all Legacy Hoopers teams)
--   4. No real-guardian leak when override active → 0 real-guardian rows

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
LANGUAGE sql STABLE SECURITY INVOKER
SET search_path = public, pg_catalog
AS $$
  WITH override AS (
    SELECT pilot_test_recipient_email
    FROM organization_settings
    WHERE organization_id = p_org_id
      AND p_pilot_only = TRUE
      AND pilot_test_recipient_email IS NOT NULL
  ),
  synthetic AS (
    -- Pilot test override: single synthetic row, bypass guardian JOIN.
    -- team_ids populated from ALL org teams so the synthetic row survives
    -- any downstream audience-scope filter (team / multi_team / org_all).
    -- guardian_id=NULL is the sentinel for UI to surface override state.
    SELECT
      NULL::uuid AS guardian_id,
      o.pilot_test_recipient_email AS email,
      'Pilot Test Recipient'::text AS full_name,
      ARRAY(SELECT id FROM public.teams WHERE org_id = p_org_id ORDER BY id)::uuid[] AS team_ids,
      ARRAY(SELECT name FROM public.teams WHERE org_id = p_org_id ORDER BY id)::text[] AS team_names
    FROM override o
  ),
  real_guardians AS (
    -- Existing pattern. Suppressed when override is in effect.
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

-- Verification: synthetic row returned when override set + pilot_only=true.
DO $$
DECLARE
  v_count int;
  v_email text;
BEGIN
  SELECT COUNT(*), MAX(email) INTO v_count, v_email
  FROM public.get_digest_recipients(
    'e3e95e21-3571-4e9a-985a-d5d01480d4a6'::uuid,
    TRUE
  );
  IF v_count != 1 OR v_email != 'admin@legacyhoopers.org' THEN
    RAISE EXCEPTION 'override verification failed: count=%, email=%', v_count, v_email;
  END IF;
  RAISE NOTICE 'wave 4.3-I get_digest_recipients override verified: 1 synthetic row → %', v_email;
END $$;

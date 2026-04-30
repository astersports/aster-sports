-- ===========================================================================
-- Migration 031: Public read RLS for tournament_teams (anon access for /records)
-- ===========================================================================
-- Source: P0 hotfix completing Wave 3c-a.1, April 30, 2026
-- Applied: 2026-04-30 via Supabase MCP apply_migration
--
-- Root cause:
--   /records tournament cards embed tournament_teams via PostgREST nested
--   select. Existing tournament_teams_read filters by auth.uid() which is
--   NULL for anon, so anon sees zero participants on every card. Cards
--   render but Champions/Finalists chips and W-L records are missing.
--
-- Fix:
--   Add tournament_teams_select_public scoped via tournaments.org_id, same
--   pattern as Migrations 025/029. Single-org pilot uses literal Legacy
--   Hoopers UUID; refactor to URL-based scoping when 2nd org joins.
-- ===========================================================================

CREATE POLICY tournament_teams_select_public ON tournament_teams
  FOR SELECT
  TO anon, authenticated
  USING (
    tournament_id IN (
      SELECT id FROM tournaments
      WHERE org_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6'
    )
  );

COMMENT ON POLICY tournament_teams_select_public ON tournament_teams IS
  'Anonymous + authenticated users can read participation rows for Legacy Hoopers tournaments. Required for /records page tournament cards. Single-org pilot.';

DO $$
DECLARE
  policy_count INT;
  participant_count INT;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'tournament_teams'
    AND policyname = 'tournament_teams_select_public';

  IF policy_count <> 1 THEN
    RAISE EXCEPTION 'Migration 031 failed: tournament_teams_select_public not created';
  END IF;

  SELECT COUNT(*) INTO participant_count
  FROM tournament_teams tt
  JOIN tournaments t ON t.id = tt.tournament_id
  WHERE t.org_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6';

  IF participant_count <> 15 THEN
    RAISE EXCEPTION 'Migration 031 verification failed: expected 15 participation rows, got %', participant_count;
  END IF;
END $$;

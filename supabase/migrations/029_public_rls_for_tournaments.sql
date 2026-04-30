-- ===========================================================================
-- Migration 029: Public read RLS for tournaments (anon access for /records)
-- ===========================================================================
-- Source: P0 hotfix completing Wave 3c-a, April 30, 2026
-- Applied: 2026-04-30 via Supabase MCP apply_migration
--
-- Existing tournaments_read policy filters by auth.uid() which is NULL for
-- anon. No error, but tournament timeline renders empty for visitors.
-- ===========================================================================

CREATE POLICY tournaments_select_public ON tournaments
  FOR SELECT
  TO anon, authenticated
  USING (org_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6');

COMMENT ON POLICY tournaments_select_public ON tournaments IS
  'Anonymous + authenticated users can read Legacy Hoopers tournaments.';

DO $$
DECLARE
  policy_count INT;
  tournament_count INT;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'tournaments'
    AND policyname = 'tournaments_select_public';
  IF policy_count <> 1 THEN
    RAISE EXCEPTION 'Migration 029 failed: tournaments_select_public not created';
  END IF;

  SELECT COUNT(*) INTO tournament_count
  FROM tournaments WHERE org_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6';
  IF tournament_count <> 7 THEN
    RAISE EXCEPTION 'Migration 029 verification failed: expected 7 tournaments, got %', tournament_count;
  END IF;
END $$;

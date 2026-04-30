-- ===========================================================================
-- Migration 028: Break RLS recursion cycle in /records public policies
-- ===========================================================================
-- Source: P0 hotfix for Migration 025, April 30, 2026
-- Applied: 2026-04-30 via Supabase MCP apply_migration
--
-- Root cause: Migration 025's events_select_public USING clause queries
-- game_results, and game_results_select_public USING clause queries events.
-- Under anon RLS evaluation Postgres detects "infinite recursion in policy".
-- Migration 025's DO-block ran as superuser with RLS bypassed, missing this.
--
-- Fix: drop and recreate both policies without cross-table references.
-- React-side game_results→events!inner join handles published-only filter.
--
-- Privacy tradeoff: anon can query events table directly. Same scope as
-- Squarespace canonical season calendar. Acceptable for pilot.
--
-- TODO (Phase 6+): SECURITY DEFINER functions to restore cross-table org
-- scoping when 2nd org joins.
-- ===========================================================================

DROP POLICY events_select_public ON events;
DROP POLICY game_results_select_public ON game_results;

CREATE POLICY events_select_public ON events
  FOR SELECT
  TO anon, authenticated
  USING (
    team_id IN (
      SELECT id FROM teams
      WHERE org_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6'
    )
  );

COMMENT ON POLICY events_select_public ON events IS
  'Anonymous + authenticated users can read Legacy Hoopers events. No cross-table check.';

CREATE POLICY game_results_select_public ON game_results
  FOR SELECT
  TO anon, authenticated
  USING (published_at IS NOT NULL);

COMMENT ON POLICY game_results_select_public ON game_results IS
  'Anonymous + authenticated users can read published game results. Single-org pilot.';

DO $$
DECLARE
  policy_count INT;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND policyname IN ('events_select_public', 'game_results_select_public')
    AND 'anon' = ANY(roles);
  IF policy_count <> 2 THEN
    RAISE EXCEPTION 'Migration 028 failed: expected 2 anon-accessible policies, got %', policy_count;
  END IF;
END $$;

-- ===========================================================================
-- Migration 025: Public read RLS for /records page (anonymous-accessible)
-- ===========================================================================
-- Source: Wave 3c-a, April 29, 2026
-- Applied: 2026-04-29 via Supabase MCP apply_migration
--
-- NOTE: The events_select_public and game_results_select_public clauses below
-- contain cross-table EXISTS/IN references that caused RLS recursion under
-- anon evaluation. Migration 028 drops and recreates both without the cycle.
-- This file preserves the original SQL as a true migration history record.
--
-- TODO (Phase 6+): Hardcoded Legacy Hoopers org_id is a single-org pilot
-- artifact. Refactor to URL-based scoping when 2nd org joins.
-- ===========================================================================

CREATE POLICY teams_select_public ON teams
  FOR SELECT
  TO anon, authenticated
  USING (org_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6');

COMMENT ON POLICY teams_select_public ON teams IS
  'Anonymous + authenticated users can read Legacy Hoopers teams. Required for /records public page.';

CREATE POLICY events_select_public ON events
  FOR SELECT
  TO anon, authenticated
  USING (
    team_id IN (
      SELECT id FROM teams
      WHERE org_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6'
    )
    AND EXISTS (
      SELECT 1 FROM game_results gr
      WHERE gr.event_id = events.id
        AND gr.published_at IS NOT NULL
    )
  );

COMMENT ON POLICY events_select_public ON events IS
  'Original cross-reference clause — superseded by Migration 028 due to RLS recursion.';

CREATE POLICY game_results_select_public ON game_results
  FOR SELECT
  TO anon, authenticated
  USING (
    published_at IS NOT NULL
    AND event_id IN (
      SELECT id FROM events
      WHERE team_id IN (
        SELECT id FROM teams
        WHERE org_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6'
      )
    )
  );

COMMENT ON POLICY game_results_select_public ON game_results IS
  'Original cross-reference clause — superseded by Migration 028 due to RLS recursion.';

DO $$
DECLARE
  policy_count INT;
  team_count INT;
  event_count INT;
  result_count INT;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND policyname IN (
      'teams_select_public',
      'events_select_public',
      'game_results_select_public'
    );

  IF policy_count <> 3 THEN
    RAISE EXCEPTION 'Migration 025 failed: expected 3 new public policies, got %', policy_count;
  END IF;

  SELECT COUNT(*) INTO team_count FROM teams
   WHERE org_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6';
  IF team_count <> 5 THEN
    RAISE EXCEPTION 'Migration 025 verification failed: expected 5 Legacy Hoopers teams, got %', team_count;
  END IF;

  SELECT COUNT(*) INTO event_count
  FROM events e
  WHERE e.team_id IN (
      SELECT id FROM teams WHERE org_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6'
    )
    AND EXISTS (
      SELECT 1 FROM game_results gr WHERE gr.event_id = e.id AND gr.published_at IS NOT NULL
    );
  IF event_count <> 27 THEN
    RAISE EXCEPTION 'Migration 025 verification failed: expected 27 events with published results, got %', event_count;
  END IF;

  SELECT COUNT(*) INTO result_count
  FROM game_results gr
  WHERE gr.published_at IS NOT NULL
    AND gr.event_id IN (
      SELECT id FROM events WHERE team_id IN (
        SELECT id FROM teams WHERE org_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6'
      )
    );
  IF result_count <> 27 THEN
    RAISE EXCEPTION 'Migration 025 verification failed: expected 27 published game_results, got %', result_count;
  END IF;
END $$;

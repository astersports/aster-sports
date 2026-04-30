-- ===========================================================================
-- Migration 025: Public read RLS for /records page (anonymous-accessible)
-- ===========================================================================
-- Source: Wave 3c-a, April 29, 2026
-- Applied: 2026-04-29 via Supabase MCP apply_migration
-- Adds three SELECT policies that grant anon + authenticated users read
-- access to data needed for the public /records page:
--   1. teams_select_public         — Legacy Hoopers teams
--   2. events_select_public        — Legacy Hoopers events with published results
--   3. game_results_select_public  — Legacy Hoopers published game results
--
-- Existing parent/staff/admin policies remain unchanged. RLS evaluates
-- policies with OR semantics, so authenticated users keep all existing
-- access plus gain access to the public-readable subset.
--
-- ----- TODO (post Migration 025) -----
-- Hardcoded Legacy Hoopers org_id 'e3e95e21-3571-4e9a-985a-d5d01480d4a6'
-- is a single-org pilot artifact. When St. Patrick's CYO Armonk joins
-- (Phase 6-7, 2027-28 per memory), refactor to URL-based scoping like
-- /orgs/:slug/records, with policies parameterized via a
-- requesting_org_id() session function or routed-org context.
-- ===========================================================================

CREATE POLICY teams_select_public ON teams
  FOR SELECT
  TO anon, authenticated
  USING (org_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6');

COMMENT ON POLICY teams_select_public ON teams IS
  'Anonymous + authenticated users can read Legacy Hoopers teams. Required for /records public page. Scoped to single org for pilot — refactor to URL-based scoping when 2nd org joins.';

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
  'Anonymous + authenticated users can read Legacy Hoopers events that have at least one published game_result. Practices, drafts, future games stay private. Required for /records public page game log embed (events!inner join).';

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
  'Anonymous + authenticated users can read published Legacy Hoopers game results. Required for /records public page. Existing parent/staff policies still apply for unpublished rows (unaffected by this addition).';

-- ----- Verification: rolls back if post-condition fails -----

DO $$
DECLARE
  policy_count INT;
  team_count INT;
  event_count INT;
  result_count INT;
BEGIN
  -- All 3 new policies must exist
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

  -- Teams policy USING clause matches 5 Legacy Hoopers teams
  SELECT COUNT(*) INTO team_count
  FROM teams
  WHERE org_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6';

  IF team_count <> 5 THEN
    RAISE EXCEPTION 'Migration 025 verification failed: expected 5 Legacy Hoopers teams visible to anon, got %', team_count;
  END IF;

  -- Events policy USING clause matches 27 events with published results
  SELECT COUNT(*) INTO event_count
  FROM events e
  WHERE e.team_id IN (
      SELECT id FROM teams
      WHERE org_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6'
    )
    AND EXISTS (
      SELECT 1 FROM game_results gr
      WHERE gr.event_id = e.id AND gr.published_at IS NOT NULL
    );

  IF event_count <> 27 THEN
    RAISE EXCEPTION 'Migration 025 verification failed: expected 27 events with published results visible to anon, got %', event_count;
  END IF;

  -- Game results policy USING clause matches 27 published Legacy Hoopers results
  SELECT COUNT(*) INTO result_count
  FROM game_results gr
  WHERE gr.published_at IS NOT NULL
    AND gr.event_id IN (
      SELECT id FROM events
      WHERE team_id IN (
        SELECT id FROM teams
        WHERE org_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6'
      )
    );

  IF result_count <> 27 THEN
    RAISE EXCEPTION 'Migration 025 verification failed: expected 27 published game_results visible to anon, got %', result_count;
  END IF;
END $$;

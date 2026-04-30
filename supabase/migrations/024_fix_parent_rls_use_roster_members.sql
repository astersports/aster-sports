-- ===========================================================================
-- Migration 024: Fix game_results parent RLS to use roster_members
-- ===========================================================================
-- Source: Wave 3b production debug session, April 29, 2026
-- Applied: 2026-04-29 via Supabase MCP apply_migration
-- Problem: game_results_select_parent queried team_players (0 rows) instead
--          of roster_members (active table). Result: parents saw 0 games for
--          their own children's teams. Surfaced by Wave 3b live-data wiring,
--          the first parent-facing surface to query game_results since parent
--          role was introduced.
-- Fix:     Drop and recreate the policy with the correct join chain.
-- Scope:   One policy. No data changes. No schema changes. Admin/staff
--          policies (game_results_select_staff, game_results_write_staff)
--          are unchanged.
-- Risk:    Atomic. Sub-second policy swap. Wrapped in transaction with
--          post-condition verification.
-- ===========================================================================

DROP POLICY IF EXISTS game_results_select_parent ON game_results;

CREATE POLICY game_results_select_parent ON game_results
  FOR SELECT
  TO authenticated
  USING (
    published_at IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM events e
      JOIN roster_members rm ON rm.team_id = e.team_id
      JOIN player_guardians pg ON pg.player_id = rm.player_id
      JOIN guardians g ON g.id = pg.guardian_id
      WHERE e.id = game_results.event_id
        AND g.user_id = (SELECT auth.uid())
    )
  );

COMMENT ON POLICY game_results_select_parent ON game_results IS
  'Parents can read published game results for any team their child is on (active or historical) via roster_members. Replaced team_players-based check in Migration 024 because team_players is unused/empty in production.';

-- ----- Verification: rolls back if post-condition fails -----

DO $$
DECLARE
  fsamaritano_visible INT;
  policy_exists INT;
BEGIN
  -- New policy must exist
  SELECT COUNT(*) INTO policy_exists
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'game_results'
    AND policyname = 'game_results_select_parent';

  IF policy_exists <> 1 THEN
    RAISE EXCEPTION 'Migration 024 failed: parent policy missing or duplicated (count=%)', policy_exists;
  END IF;

  -- fsamaritano should now see exactly 15 published games (7 + 8 across 11U Girls + 8U Boys)
  SELECT COUNT(DISTINCT gr.id) INTO fsamaritano_visible
  FROM guardians g
  JOIN player_guardians pg ON pg.guardian_id = g.id
  JOIN roster_members rm ON rm.player_id = pg.player_id
  JOIN events e ON e.team_id = rm.team_id
  JOIN game_results gr ON gr.event_id = e.id
  WHERE g.user_id = '0b81b465-225e-4ede-b752-ed9a2dde1f7c'
    AND gr.published_at IS NOT NULL;

  IF fsamaritano_visible <> 15 THEN
    RAISE EXCEPTION 'Migration 024 verification failed: expected 15 visible games for parent, got %', fsamaritano_visible;
  END IF;
END $$;

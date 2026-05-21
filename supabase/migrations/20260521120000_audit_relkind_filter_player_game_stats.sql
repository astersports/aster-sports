-- Audit discipline migration — anti-pattern #24 (relkind='r' filter).
-- Historical 20260505180059_wave_5c1_player_game_stats.sql:99 checked
-- pg_class.relrowsecurity WITHOUT the relkind='r' filter. The target
-- is a freshly-CREATEd table (not a view), so false-positive in
-- practice. This migration re-runs the check WITH the proper filter
-- as discipline lock.

DO $$
DECLARE
  rls_enabled boolean;
BEGIN
  SELECT c.relrowsecurity
  INTO rls_enabled
  FROM pg_class c
  WHERE c.oid = 'public.player_game_stats'::regclass
    AND c.relkind = 'r';

  IF rls_enabled IS NULL THEN
    RAISE EXCEPTION 'player_game_stats not found as a base table (relkind=r)';
  END IF;

  IF NOT rls_enabled THEN
    RAISE EXCEPTION 'player_game_stats has RLS disabled — audit fail';
  END IF;

  RAISE NOTICE 'player_game_stats RLS verified with relkind=r filter';
END $$;

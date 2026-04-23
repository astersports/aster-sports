-- ============================================================
-- 018_team_achievements_REVERT.sql
--
-- Rollback for Migration 018. Run ONLY if Migration 018 causes
-- production regression. WARNING: destroys all achievement data.
--
-- This REVERT:
--   1. Drops the team_achievements table (CASCADE drops all policies,
--      indexes, CHECK constraints, updated_at trigger)
--   2. Drops the updated_at function
--
-- Before running, capture data if any achievements have been recorded:
--   SELECT * FROM public.team_achievements;
--
-- Safe to re-apply: idempotent.
-- ============================================================

BEGIN;

-- 1. Drop table (cascades to policies, indexes, CHECK constraints, updated_at trigger)
DROP TABLE IF EXISTS public.team_achievements CASCADE;

-- 2. Drop updated_at function (not auto-dropped)
DROP FUNCTION IF EXISTS public.team_achievements_set_updated_at();

-- 3. Reload PostgREST cache
NOTIFY pgrst, 'reload schema';

COMMIT;

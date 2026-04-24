-- ============================================================
-- 021_team_players_date_windows_REVERT.sql
--
-- Rollback for Migration 021. Run ONLY if Migration 021 causes
-- production regression.
--
-- WARNING: dropping columns loses all joined_at / left_at data
-- written since migration applied. Capture first:
--   SELECT id, team_id, player_id, joined_at, left_at FROM team_players;
--
-- This REVERT:
--   1. Drops indexes
--   2. Drops CHECK constraint
--   3. Drops left_at and joined_at columns
--
-- Safe to re-apply: idempotent.
-- ============================================================

BEGIN;

-- 1. Drop indexes
DROP INDEX IF EXISTS public.idx_team_players_team_date_window;
DROP INDEX IF EXISTS public.idx_team_players_active_roster;
DROP INDEX IF EXISTS public.idx_team_players_player_active;

-- 2. Drop CHECK constraint
ALTER TABLE public.team_players
  DROP CONSTRAINT IF EXISTS team_players_dates_coherent;

-- 3. Drop columns (WARNING: destroys data)
ALTER TABLE public.team_players
  DROP COLUMN IF EXISTS left_at,
  DROP COLUMN IF EXISTS joined_at;

-- 4. Reload PostgREST cache
NOTIFY pgrst, 'reload schema';

COMMIT;

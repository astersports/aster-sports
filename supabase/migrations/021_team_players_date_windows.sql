-- ============================================================
-- 021_team_players_date_windows.sql
--
-- Adds joined_at + left_at columns to team_players to support
-- per-player date-windowed queries (needed for Migration 022
-- attendance trending views, and for any future feature that needs
-- to answer "was this player on this team when event X happened?").
--
-- Current schema has only team_players.created_at (when the row was
-- inserted) which doesn't distinguish retroactive adds from true
-- join date, and has no way to represent a player leaving a team
-- without DELETE (which loses history).
--
-- Columns added:
--   - joined_at timestamptz NOT NULL  Date player joined this team
--   - left_at timestamptz             Nullable; NULL = still active
--
-- Backfill: existing rows get joined_at = created_at and left_at = NULL.
-- Going forward, the app should write joined_at explicitly when
-- adding a player to a team; left_at is set instead of DELETE when
-- a player leaves.
--
-- Indexes added:
--   - Composite (team_id, joined_at, left_at) for event-window queries
--   - Partial index on (player_id, left_at IS NULL) for active-team lookups
--
-- Safe to re-apply: idempotent.
-- ============================================================

BEGIN;

-- ============================================================
-- 1. Add columns (IF NOT EXISTS for idempotency)
-- ============================================================

-- joined_at: NOT NULL with placeholder default, backfilled from created_at below
ALTER TABLE public.team_players
  ADD COLUMN IF NOT EXISTS joined_at timestamptz;

ALTER TABLE public.team_players
  ADD COLUMN IF NOT EXISTS left_at timestamptz;

-- ============================================================
-- 2. Backfill: set joined_at = created_at for rows where it's still null
-- ============================================================
UPDATE public.team_players
SET joined_at = created_at
WHERE joined_at IS NULL;

-- ============================================================
-- 3. Now enforce NOT NULL on joined_at (after backfill so no rows fail)
-- ============================================================
ALTER TABLE public.team_players
  ALTER COLUMN joined_at SET NOT NULL;

-- ============================================================
-- 4. Add default for future inserts (fallback to now() if app doesn't
--    explicitly set joined_at)
-- ============================================================
ALTER TABLE public.team_players
  ALTER COLUMN joined_at SET DEFAULT now();

-- ============================================================
-- 5. Column comments
-- ============================================================
COMMENT ON COLUMN public.team_players.joined_at IS
  'When the player joined this team. Distinct from created_at which is row-insert time. Used by attendance views (Migration 022) to filter events to only those where the player was rostered. Defaults to now() if not explicitly set.';

COMMENT ON COLUMN public.team_players.left_at IS
  'When the player left this team. NULL means still active. Use UPDATE ... SET left_at = now() instead of DELETE to preserve roster history. Enables retrospective queries like "who was on 10U Black in April 2026".';

-- ============================================================
-- 6. CHECK constraint: left_at must be after joined_at when set
-- ============================================================
ALTER TABLE public.team_players
  DROP CONSTRAINT IF EXISTS team_players_dates_coherent;
ALTER TABLE public.team_players
  ADD CONSTRAINT team_players_dates_coherent
  CHECK (left_at IS NULL OR left_at >= joined_at);

-- ============================================================
-- 7. Indexes for attendance view queries
-- ============================================================

-- Composite index for "was this player on this team during time window X"
CREATE INDEX IF NOT EXISTS idx_team_players_team_date_window
  ON public.team_players (team_id, joined_at, left_at);

-- Partial index for "current active roster of team X"
CREATE INDEX IF NOT EXISTS idx_team_players_active_roster
  ON public.team_players (team_id, player_id)
  WHERE left_at IS NULL;

-- Partial index for "all teams player X is currently on"
CREATE INDEX IF NOT EXISTS idx_team_players_player_active
  ON public.team_players (player_id, team_id)
  WHERE left_at IS NULL;

-- ============================================================
-- 8. Reload PostgREST cache
-- ============================================================
NOTIFY pgrst, 'reload schema';

COMMIT;

-- ============================================================
-- 023_attendance_trending_views_REVERT.sql
--
-- Reverts Migration 023.
--
-- WARNING: events.season_id column NOT dropped to preserve backfill data.
-- To fully revert: ALTER TABLE public.events DROP COLUMN season_id;
-- ============================================================

BEGIN;

DROP VIEW IF EXISTS public.team_attendance_30d;
DROP VIEW IF EXISTS public.team_rsvp_30d;
DROP VIEW IF EXISTS public.player_attendance_season;
DROP VIEW IF EXISTS public.player_rsvp_season;

DROP INDEX IF EXISTS public.idx_events_season_team;
DROP INDEX IF EXISTS public.idx_events_team_start;

NOTIFY pgrst, 'reload schema';

COMMIT;

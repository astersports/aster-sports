-- Mirror file backfilled 2026-05-28 from supabase_migrations.schema_migrations.statements per Wave 2.A audit #23 P0-1.
-- Original SQL applied via chat-side claude.ai MCP without same-turn mirror; this file restores the AP #21 mirror invariant.
-- ============================================================
-- 031_tournament_times_correction.sql
--
-- Fixes 9 tournament events that have midnight (00:00:00) start_at
-- in Eastern time, which surfaces as "Sat 12:00am" on parent NEXT UP cards.
-- Migration 024 schedule reseed dropped these as all-day placeholders
-- without specific times.
--
-- Per Frank decision April 26 2026:
--   Sets all tournament events to start 08:00 Eastern (8am)
--   Sets all tournament events to end 20:00 Eastern (8pm) on their end_date
--
-- Single-day tournaments: 08:00-20:00 same day
-- Multi-day tournaments: 08:00 day 1 → 20:00 final day
--
-- Affects 9 events:
--   3 x Rumble for the Ring CT (May 16) [10U Black, 11U Girls, 8U Boys]
--   1 x Zero Gravity Girls National Finals (May 29-31) [11U Girls]
--   1 x Zero Gravity Boys National Finals (June 5-7) [10U Black]
--   1 x Pre Summer Hoops Jam Classic (June 6-7) [8U Boys]
--   3 x Zero Gravity NY Hoop Festival (June 13-14) [10U Black, 11U Girls, 8U Boys]
--
-- Safe to re-apply: idempotent (filters by current midnight state).
-- ============================================================

BEGIN;

-- Update all tournament events with midnight Eastern start_at
-- Set start_at = 08:00 Eastern of the current start date
-- Set end_at   = 20:00 Eastern of the current end date
UPDATE public.events
SET
  start_at = ((start_at AT TIME ZONE 'America/New_York')::date
              + TIME '08:00:00') AT TIME ZONE 'America/New_York',
  end_at = ((end_at AT TIME ZONE 'America/New_York')::date
            + TIME '20:00:00') AT TIME ZONE 'America/New_York'
WHERE event_type = 'tournament'
  AND (start_at AT TIME ZONE 'America/New_York')::time = '00:00:00';

NOTIFY pgrst, 'reload schema';

COMMIT;

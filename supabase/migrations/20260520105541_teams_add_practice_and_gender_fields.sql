-- Adds the 4 columns TeamFormSheet writes to but never had backing schema
-- for. PostgREST rejected every Edit Team save with 42703 ("column does
-- not exist") on the FIRST unknown column it saw, silently failing the
-- entire UPDATE. Frank-reported 2026-05-20.
--
-- All four nullable, no defaults. The form already constrains the value
-- set (mon/tue/wed/thu/fri/sat/sun, male/female/coed) — no need for DB
-- CHECK constraints that would make the migration brittle to future
-- form changes.

ALTER TABLE public.teams
  ADD COLUMN IF NOT EXISTS practice_day TEXT,
  ADD COLUMN IF NOT EXISTS practice_location TEXT,
  ADD COLUMN IF NOT EXISTS circuit_name TEXT,
  ADD COLUMN IF NOT EXISTS gender TEXT;

COMMENT ON COLUMN public.teams.practice_day IS 'Weekly practice day key from TeamFormSheet (mon/tue/wed/thu/fri/sat/sun). Display label maps via src/lib/constants.js DAY_LABELS.';
COMMENT ON COLUMN public.teams.practice_location IS 'Free-text practice venue (e.g., "Westchester Community Center", "WCC"). Distinct from event location_id — this is the recurring practice anchor.';
COMMENT ON COLUMN public.teams.circuit_name IS 'Free-text circuit name shown when teams.circuit = aau (e.g., "Zero Gravity"). NULL when circuit is league_play or tournament.';
COMMENT ON COLUMN public.teams.gender IS 'Team gender key from TeamFormSheet (male/female/coed). Encoded in display name (e.g., "11U Girls") but stored separately for downstream filters/segmentation.';

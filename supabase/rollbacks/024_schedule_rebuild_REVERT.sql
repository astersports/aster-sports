-- ============================================================
-- 024_schedule_rebuild_REVERT.sql
-- ============================================================
-- Reverts Migration 024 DESTRUCTIVELY.
-- WARNING: Cannot restore destroyed test data (145 events + 54 RSVPs + 26 rides +
-- 112 duties + 5 checkins + 2 comments). Confirmed destroyable per L99 session.
-- ============================================================

BEGIN;

-- 1. Drop all 140 reseeded draft events
DELETE FROM public.events
WHERE start_at >= '2026-03-23' AND start_at < '2026-06-15'
  AND publish_status = 'draft';

-- 2. Drop location_rooms rows
DELETE FROM public.location_rooms;

-- 3. Drop schema columns on events
ALTER TABLE public.events DROP COLUMN IF EXISTS arrival_time;
ALTER TABLE public.events DROP COLUMN IF EXISTS publish_status;
ALTER TABLE public.events DROP COLUMN IF EXISTS location_room_id;
ALTER TABLE public.events DROP COLUMN IF EXISTS location_id;

-- 4. Drop schema columns on locations
ALTER TABLE public.locations DROP COLUMN IF EXISTS google_maps_url;
ALTER TABLE public.locations DROP COLUMN IF EXISTS entry_instructions;
ALTER TABLE public.locations DROP COLUMN IF EXISTS parking_notes;
ALTER TABLE public.locations DROP COLUMN IF EXISTS longitude;
ALTER TABLE public.locations DROP COLUMN IF EXISTS latitude;

-- 5. Drop location_rooms table
DROP TABLE IF EXISTS public.location_rooms;

-- 6. Restore seasons.end_date
UPDATE public.seasons 
SET end_date = '2026-06-15' 
WHERE id = 'b8a83563-6878-4ebb-8918-9d884050ab23';

-- 7. Reverse location naming (best effort)
UPDATE public.locations SET name = 'St. Patricks' WHERE name = 'St. Patrick''s';
UPDATE public.locations SET name = 'Harvey School' WHERE name = 'The Harvey School';
UPDATE public.locations SET name = 'Hackley School' WHERE name = 'The Hackley School';
UPDATE public.locations SET name = 'Westchester Community College (WCC)' WHERE name = 'Westchester Community College';
UPDATE public.locations SET name = 'East Coast Sports and Fitness' WHERE name = 'East Coast Sports & Fitness';
UPDATE public.locations SET name = 'Sarah Lawrence College - Campbell Sports Center' WHERE name = 'Sarah Lawrence College';
UPDATE public.locations SET name = 'St Joseph-Bronxville' WHERE name = 'St. Joseph-Bronxville';
UPDATE public.locations SET name = 'IC-Tuckahoe' WHERE name = 'Immaculate Conception-Tuckahoe';
UPDATE public.locations SET name = 'CYO Spellman Rec' WHERE name = 'Cardinal Spellman HS';
UPDATE public.locations SET name = 'Resurrection Doty Gym' WHERE name = 'Resurrection School - Doty Gym';

-- 8. Remove OLPH 5A
DELETE FROM public.opponents WHERE name = 'OLPH 5A';

NOTIFY pgrst, 'reload schema';

COMMIT;

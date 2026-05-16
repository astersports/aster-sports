-- Phase Beta B5 Finding 1 — defense-in-depth backfill.
-- Tournament events from the parser-era have events.location_id populated
-- but events.location text column NULL. The renderer fix (PR #214) joins
-- locations and falls back, so the surface renders correctly. This
-- backfill is the second half of "defense in depth" — any code path
-- that reads events.location directly (without the join) also works.

UPDATE events
SET location = l.name
FROM locations l
WHERE events.location IS NULL
  AND events.location_id IS NOT NULL
  AND events.location_id = l.id;

DO $$
DECLARE
  v_remaining int;
BEGIN
  SELECT count(*) INTO v_remaining
  FROM events WHERE location IS NULL AND location_id IS NOT NULL;
  IF v_remaining > 0 THEN
    RAISE EXCEPTION 'Backfill incomplete: % events still have NULL location with non-null location_id', v_remaining;
  END IF;
  RAISE NOTICE 'Beta B5 backfill: all events with location_id now have location text populated';
END $$;

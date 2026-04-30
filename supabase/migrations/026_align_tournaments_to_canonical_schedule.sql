-- ===========================================================================
-- Migration 026: Align tournaments table to canonical Squarespace schedule
-- ===========================================================================
-- Source: season-calendar HTML (canonical Spring 2026 schedule), pasted by
--         Frank Apr 29, 2026.
-- Applied: 2026-04-29 via Supabase MCP apply_migration
-- Problem: tournaments table had three categories of drift vs canonical:
--          1. Naming inconsistency: ZG prefix missing on some, all-caps on
--             one, "2026 Zero Gravity" prefix on Nationals.
--          2. End-date drift: 1-2 day longer end_dates than canonical.
--          3. One duplicate (Apr 18-19) and one phantom (Chase 2026 May 15-17
--             not in canonical schedule).
-- Strategy: target each affected row by id (from pre-flight), update name +
--           dates + venue, delete two rows confirmed orphaned (0 events).
-- Idempotency: each statement is row-bound by id. Safe to re-run.
-- Risk: low. 0 events orphaned (verified pre-flight: deleted rows had 0
--       linked events, kept rows preserve their existing event chains).
-- ===========================================================================

-- ----- UPDATEs -----

UPDATE tournaments SET
  name = 'ZG Chase for the Chain NY',
  primary_venue = 'Westchester County, NY'
WHERE id = '61e2cbca-af87-4685-a928-57d3da06cd84';

UPDATE tournaments SET
  name = 'ZG NY Metro Showdown',
  primary_venue = 'House of Sports'
WHERE id = '54885ddf-7762-4208-b772-e9d99327d5fe';

UPDATE tournaments SET
  name = 'ZG Rumble for the Ring CT',
  end_date = '2026-05-17',
  primary_venue = 'Fairfield County, CT'
WHERE id = '196e595d-6b35-4b5e-8253-502b122cb5cb';

UPDATE tournaments SET
  name = 'Girls Nationals - ZG',
  end_date = '2026-05-31',
  primary_venue = 'Metrowest, MA'
WHERE id = '0fc1f7a1-45bb-4c21-a3e7-2003a004a47a';

UPDATE tournaments SET
  name = 'Boys Nationals - ZG',
  end_date = '2026-06-07',
  primary_venue = 'Metrowest, MA'
WHERE id = 'f5c7766a-603b-4827-bebc-be2a1cfa0cc6';

UPDATE tournaments SET
  name = 'BBallShootout: Pre Summer Hoops Jam Classic 1',
  end_date = '2026-06-07',
  primary_venue = 'Bergen County, NJ'
WHERE id = '4de1c027-f8c9-4c29-a3c6-1f75c1077a96';

UPDATE tournaments SET
  name = 'ZG NY Hoop Festival - Season Finale',
  end_date = '2026-06-14',
  primary_venue = 'Westchester County, NY'
WHERE id = '9ae25f54-46e9-4d65-8eda-346753af9a2a';

-- ----- DELETEs (both rows verified pre-flight: 0 linked events) -----

DELETE FROM tournaments WHERE id = 'f5e0b636-beb4-4a8e-aeb2-2b11554ebb60';
-- ^ "ZG NY METRO SHOWDOWN" all-caps duplicate (Apr 18-19, House of Sports
--   venue moved to row id 54885dd... above before this delete)

DELETE FROM tournaments WHERE id = '134fda35-e966-4731-a166-2d4892dec9dc';
-- ^ "Chase for the Chain NY 2026" phantom (May 15-17, not in canonical)

-- ----- Verification: rolls back if post-condition fails -----

DO $$
DECLARE
  total_count INT;
  empty_venue_count INT;
  expected_names TEXT[] := ARRAY[
    'ZG Chase for the Chain NY',
    'ZG NY Metro Showdown',
    'ZG Rumble for the Ring CT',
    'Girls Nationals - ZG',
    'Boys Nationals - ZG',
    'BBallShootout: Pre Summer Hoops Jam Classic 1',
    'ZG NY Hoop Festival - Season Finale'
  ];
  matched_names INT;
  bad_old_names INT;
BEGIN
  -- Spring 2026 tournament count must be exactly 7
  SELECT COUNT(*) INTO total_count
  FROM tournaments
  WHERE org_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6'
    AND start_date >= '2026-03-01'
    AND start_date < '2026-07-01';

  IF total_count <> 7 THEN
    RAISE EXCEPTION 'Migration 026 failed: expected 7 Spring 2026 tournaments, got %', total_count;
  END IF;

  -- All 7 must have non-empty primary_venue
  SELECT COUNT(*) INTO empty_venue_count
  FROM tournaments
  WHERE org_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6'
    AND start_date >= '2026-03-01'
    AND start_date < '2026-07-01'
    AND (primary_venue IS NULL OR primary_venue = '');

  IF empty_venue_count > 0 THEN
    RAISE EXCEPTION 'Migration 026 failed: % Spring 2026 tournaments still have empty venue', empty_venue_count;
  END IF;

  -- All 7 expected canonical names must be present
  SELECT COUNT(*) INTO matched_names
  FROM tournaments
  WHERE org_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6'
    AND start_date >= '2026-03-01'
    AND start_date < '2026-07-01'
    AND name = ANY(expected_names);

  IF matched_names <> 7 THEN
    RAISE EXCEPTION 'Migration 026 failed: only % of 7 canonical tournament names matched', matched_names;
  END IF;

  -- The two deleted rows must be gone
  SELECT COUNT(*) INTO bad_old_names
  FROM tournaments
  WHERE name IN ('ZG NY METRO SHOWDOWN', 'Chase for the Chain NY 2026');

  IF bad_old_names > 0 THEN
    RAISE EXCEPTION 'Migration 026 failed: % deprecated rows still present', bad_old_names;
  END IF;
END $$;

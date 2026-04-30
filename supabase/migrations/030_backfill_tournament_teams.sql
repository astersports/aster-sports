-- ===========================================================================
-- Migration 030: Backfill tournament_teams gaps + populate completed results
-- ===========================================================================
-- Source: Wave 3c-a.1 prep, April 30, 2026
-- Applied: 2026-04-30 via Supabase MCP apply_migration
--
-- Three changes:
--   1. INSERT 3 missing rows for ZG NY Metro Showdown (11U Girls, 10U Black,
--      8U Boys all played there per events.tournament_id, but tournament_teams
--      had no entries).
--   2. UPDATE 3 Chase for the Chain rows with final_place + final records:
--      - 11U Girls: 4-0 Champions
--      - 10U Black: 5-0 Champions
--      - 8U Boys:   2-2 Finalists (lost championship 12-45 to Rundown NYC)
--   3. UPDATE 3 NY Metro Showdown rows with final records (no placement):
--      - 11U Girls: 1-2
--      - 10U Black: 0-4
--      - 8U Boys:   1-3
--
-- Future tournaments keep final_place=NULL and final_record_*=0 until they
-- happen. /records page renders those as "Upcoming" without placement chip.
--
-- Records computed from game_results.result text column (W/L), filtered to
-- published rows only. Manually verified against records-v14_2.html reference.
-- ===========================================================================

INSERT INTO tournament_teams (tournament_id, team_id, final_record_wins, final_record_losses, final_place)
VALUES
  ((SELECT id FROM tournaments
      WHERE name='ZG NY Metro Showdown'
        AND org_id='e3e95e21-3571-4e9a-985a-d5d01480d4a6'),
   '507d7a4e-553e-4ba7-a61c-38d6cdf2f364', 1, 2, NULL),
  ((SELECT id FROM tournaments
      WHERE name='ZG NY Metro Showdown'
        AND org_id='e3e95e21-3571-4e9a-985a-d5d01480d4a6'),
   '6abb0447-8866-461c-bd78-1c58eebf9551', 0, 4, NULL),
  ((SELECT id FROM tournaments
      WHERE name='ZG NY Metro Showdown'
        AND org_id='e3e95e21-3571-4e9a-985a-d5d01480d4a6'),
   'e6dde2e0-38f7-46c9-ad1a-5ac253a2a570', 1, 3, NULL);

UPDATE tournament_teams
   SET final_place = 'Champions', final_record_wins = 4, final_record_losses = 0
 WHERE tournament_id = (SELECT id FROM tournaments
                          WHERE name='ZG Chase for the Chain NY'
                            AND org_id='e3e95e21-3571-4e9a-985a-d5d01480d4a6')
   AND team_id = '507d7a4e-553e-4ba7-a61c-38d6cdf2f364';

UPDATE tournament_teams
   SET final_place = 'Champions', final_record_wins = 5, final_record_losses = 0
 WHERE tournament_id = (SELECT id FROM tournaments
                          WHERE name='ZG Chase for the Chain NY'
                            AND org_id='e3e95e21-3571-4e9a-985a-d5d01480d4a6')
   AND team_id = '6abb0447-8866-461c-bd78-1c58eebf9551';

UPDATE tournament_teams
   SET final_place = 'Finalists', final_record_wins = 2, final_record_losses = 2
 WHERE tournament_id = (SELECT id FROM tournaments
                          WHERE name='ZG Chase for the Chain NY'
                            AND org_id='e3e95e21-3571-4e9a-985a-d5d01480d4a6')
   AND team_id = 'e6dde2e0-38f7-46c9-ad1a-5ac253a2a570';

DO $$
DECLARE
  ny_metro_count INT;
  chase_champ_count INT;
  chase_finalist_count INT;
  total_rows INT;
BEGIN
  SELECT COUNT(*) INTO ny_metro_count
    FROM tournament_teams tt
    JOIN tournaments t ON t.id = tt.tournament_id
   WHERE t.name = 'ZG NY Metro Showdown'
     AND t.org_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6';
  IF ny_metro_count <> 3 THEN
    RAISE EXCEPTION 'Migration 030 failed: expected 3 NY Metro rows, got %', ny_metro_count;
  END IF;

  SELECT COUNT(*) INTO chase_champ_count
    FROM tournament_teams tt
    JOIN tournaments t ON t.id = tt.tournament_id
   WHERE t.name = 'ZG Chase for the Chain NY' AND tt.final_place = 'Champions';
  IF chase_champ_count <> 2 THEN
    RAISE EXCEPTION 'Migration 030 failed: expected 2 Chase Champions, got %', chase_champ_count;
  END IF;

  SELECT COUNT(*) INTO chase_finalist_count
    FROM tournament_teams tt
    JOIN tournaments t ON t.id = tt.tournament_id
   WHERE t.name = 'ZG Chase for the Chain NY' AND tt.final_place = 'Finalists';
  IF chase_finalist_count <> 1 THEN
    RAISE EXCEPTION 'Migration 030 failed: expected 1 Chase Finalist, got %', chase_finalist_count;
  END IF;

  SELECT COUNT(*) INTO total_rows
    FROM tournament_teams tt
    JOIN tournaments t ON t.id = tt.tournament_id
   WHERE t.org_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6';
  IF total_rows <> 15 THEN
    RAISE EXCEPTION 'Migration 030 failed: expected 15 total rows, got %', total_rows;
  END IF;
END $$;

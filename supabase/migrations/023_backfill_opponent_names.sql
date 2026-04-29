-- ===========================================================================
-- Migration 023: Backfill opponent names and championship flag
-- ===========================================================================
-- Source: records-v14_2.html lines 637-736 (canonical Spring 2026 records)
-- Applied: 2026-04-29 via Supabase MCP apply_migration
-- Affects:
--   1. events.opponent: backfill 24 NULL rows for AAU tournament games
--   2. events.is_championship_final: new column, set true on 3 final games
-- Skips:
--   3 League Play rows already populated (10U Blue x2, 9U Boys x1)
-- Strategy: Match by (team_name, date, our_score, opponent_score).
--           All 24 tuples verified unique via pre-flight Supabase MCP query.
-- Idempotent: Each UPDATE is row-bound by exact event id. Safe to re-run.
-- ===========================================================================

-- ----- Schema change: add championship flag column -----

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS is_championship_final BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN events.is_championship_final IS
  'Tournament championship final game. Used by broadcast components for badge rendering.';

-- ----- 11U Girls (7 games) -----

UPDATE events SET opponent = 'Level Up' WHERE id = (
  SELECT e.id FROM events e
  JOIN teams t ON t.id = e.team_id
  JOIN game_results gr ON gr.event_id = e.id
  WHERE t.name = '11U Girls'
    AND e.start_at::date = '2026-04-11'
    AND gr.our_score = 29 AND gr.opponent_score = 12
);

UPDATE events SET opponent = 'Showtime Elite' WHERE id = (
  SELECT e.id FROM events e
  JOIN teams t ON t.id = e.team_id
  JOIN game_results gr ON gr.event_id = e.id
  WHERE t.name = '11U Girls'
    AND e.start_at::date = '2026-04-12'
    AND gr.our_score = 40 AND gr.opponent_score = 9
);

UPDATE events SET opponent = 'NY Extreme Black' WHERE id = (
  SELECT e.id FROM events e
  JOIN teams t ON t.id = e.team_id
  JOIN game_results gr ON gr.event_id = e.id
  WHERE t.name = '11U Girls'
    AND e.start_at::date = '2026-04-12'
    AND gr.our_score = 26 AND gr.opponent_score = 16
);

UPDATE events SET opponent = 'NY Extreme Black', is_championship_final = true WHERE id = (
  SELECT e.id FROM events e
  JOIN teams t ON t.id = e.team_id
  JOIN game_results gr ON gr.event_id = e.id
  WHERE t.name = '11U Girls'
    AND e.start_at::date = '2026-04-12'
    AND gr.our_score = 35 AND gr.opponent_score = 21
);

UPDATE events SET opponent = 'Palisades Elite' WHERE id = (
  SELECT e.id FROM events e
  JOIN teams t ON t.id = e.team_id
  JOIN game_results gr ON gr.event_id = e.id
  WHERE t.name = '11U Girls'
    AND e.start_at::date = '2026-04-18'
    AND gr.our_score = 20 AND gr.opponent_score = 43
);

UPDATE events SET opponent = 'NY Gauchos' WHERE id = (
  SELECT e.id FROM events e
  JOIN teams t ON t.id = e.team_id
  JOIN game_results gr ON gr.event_id = e.id
  WHERE t.name = '11U Girls'
    AND e.start_at::date = '2026-04-18'
    AND gr.our_score = 14 AND gr.opponent_score = 24
);

UPDATE events SET opponent = 'Rockland Spartans Maroon' WHERE id = (
  SELECT e.id FROM events e
  JOIN teams t ON t.id = e.team_id
  JOIN game_results gr ON gr.event_id = e.id
  WHERE t.name = '11U Girls'
    AND e.start_at::date = '2026-04-19'
    AND gr.our_score = 29 AND gr.opponent_score = 24
);

-- ----- 10U Black (9 games) -----

UPDATE events SET opponent = '6th Boro Hoops' WHERE id = (
  SELECT e.id FROM events e
  JOIN teams t ON t.id = e.team_id
  JOIN game_results gr ON gr.event_id = e.id
  WHERE t.name = '10U Black'
    AND e.start_at::date = '2026-04-11'
    AND gr.our_score = 43 AND gr.opponent_score = 19
);

UPDATE events SET opponent = 'Rising Stars' WHERE id = (
  SELECT e.id FROM events e
  JOIN teams t ON t.id = e.team_id
  JOIN game_results gr ON gr.event_id = e.id
  WHERE t.name = '10U Black'
    AND e.start_at::date = '2026-04-11'
    AND gr.our_score = 21 AND gr.opponent_score = 18
);

UPDATE events SET opponent = 'Bobcats Basketball' WHERE id = (
  SELECT e.id FROM events e
  JOIN teams t ON t.id = e.team_id
  JOIN game_results gr ON gr.event_id = e.id
  WHERE t.name = '10U Black'
    AND e.start_at::date = '2026-04-12'
    AND gr.our_score = 40 AND gr.opponent_score = 19
);

UPDATE events SET opponent = 'Northeast Elite Red' WHERE id = (
  SELECT e.id FROM events e
  JOIN teams t ON t.id = e.team_id
  JOIN game_results gr ON gr.event_id = e.id
  WHERE t.name = '10U Black'
    AND e.start_at::date = '2026-04-12'
    AND gr.our_score = 41 AND gr.opponent_score = 18
);

UPDATE events SET opponent = 'Northeast Elite Red', is_championship_final = true WHERE id = (
  SELECT e.id FROM events e
  JOIN teams t ON t.id = e.team_id
  JOIN game_results gr ON gr.event_id = e.id
  WHERE t.name = '10U Black'
    AND e.start_at::date = '2026-04-12'
    AND gr.our_score = 39 AND gr.opponent_score = 17
);

UPDATE events SET opponent = 'Stars Academy' WHERE id = (
  SELECT e.id FROM events e
  JOIN teams t ON t.id = e.team_id
  JOIN game_results gr ON gr.event_id = e.id
  WHERE t.name = '10U Black'
    AND e.start_at::date = '2026-04-18'
    AND gr.our_score = 34 AND gr.opponent_score = 38
);

UPDATE events SET opponent = 'NY Extreme Red' WHERE id = (
  SELECT e.id FROM events e
  JOIN teams t ON t.id = e.team_id
  JOIN game_results gr ON gr.event_id = e.id
  WHERE t.name = '10U Black'
    AND e.start_at::date = '2026-04-18'
    AND gr.our_score = 28 AND gr.opponent_score = 31
);

UPDATE events SET opponent = 'Greenwich Stars' WHERE id = (
  SELECT e.id FROM events e
  JOIN teams t ON t.id = e.team_id
  JOIN game_results gr ON gr.event_id = e.id
  WHERE t.name = '10U Black'
    AND e.start_at::date = '2026-04-19'
    AND gr.our_score = 28 AND gr.opponent_score = 48
);

UPDATE events SET opponent = 'Northeast Elite' WHERE id = (
  SELECT e.id FROM events e
  JOIN teams t ON t.id = e.team_id
  JOIN game_results gr ON gr.event_id = e.id
  WHERE t.name = '10U Black'
    AND e.start_at::date = '2026-04-19'
    AND gr.our_score = 12 AND gr.opponent_score = 42
);

-- ----- 8U Boys (8 games) -----

UPDATE events SET opponent = 'Triple Double Blue' WHERE id = (
  SELECT e.id FROM events e
  JOIN teams t ON t.id = e.team_id
  JOIN game_results gr ON gr.event_id = e.id
  WHERE t.name = '8U Boys'
    AND e.start_at::date = '2026-04-11'
    AND gr.our_score = 12 AND gr.opponent_score = 11
);

UPDATE events SET opponent = 'RTG' WHERE id = (
  SELECT e.id FROM events e
  JOIN teams t ON t.id = e.team_id
  JOIN game_results gr ON gr.event_id = e.id
  WHERE t.name = '8U Boys'
    AND e.start_at::date = '2026-04-11'
    AND gr.our_score = 38 AND gr.opponent_score = 14
);

UPDATE events SET opponent = 'Rundown NYC' WHERE id = (
  SELECT e.id FROM events e
  JOIN teams t ON t.id = e.team_id
  JOIN game_results gr ON gr.event_id = e.id
  WHERE t.name = '8U Boys'
    AND e.start_at::date = '2026-04-12'
    AND gr.our_score = 14 AND gr.opponent_score = 28
);

UPDATE events SET opponent = 'Rundown NYC', is_championship_final = true WHERE id = (
  SELECT e.id FROM events e
  JOIN teams t ON t.id = e.team_id
  JOIN game_results gr ON gr.event_id = e.id
  WHERE t.name = '8U Boys'
    AND e.start_at::date = '2026-04-12'
    AND gr.our_score = 12 AND gr.opponent_score = 45
);

UPDATE events SET opponent = 'Riverside Hawks' WHERE id = (
  SELECT e.id FROM events e
  JOIN teams t ON t.id = e.team_id
  JOIN game_results gr ON gr.event_id = e.id
  WHERE t.name = '8U Boys'
    AND e.start_at::date = '2026-04-18'
    AND gr.our_score = 29 AND gr.opponent_score = 27
);

UPDATE events SET opponent = 'Westchester Wave' WHERE id = (
  SELECT e.id FROM events e
  JOIN teams t ON t.id = e.team_id
  JOIN game_results gr ON gr.event_id = e.id
  WHERE t.name = '8U Boys'
    AND e.start_at::date = '2026-04-18'
    AND gr.our_score = 14 AND gr.opponent_score = 28
);

UPDATE events SET opponent = 'Westchester Wave' WHERE id = (
  SELECT e.id FROM events e
  JOIN teams t ON t.id = e.team_id
  JOIN game_results gr ON gr.event_id = e.id
  WHERE t.name = '8U Boys'
    AND e.start_at::date = '2026-04-19'
    AND gr.our_score = 10 AND gr.opponent_score = 41
);

UPDATE events SET opponent = 'Atlantic Sharks' WHERE id = (
  SELECT e.id FROM events e
  JOIN teams t ON t.id = e.team_id
  JOIN game_results gr ON gr.event_id = e.id
  WHERE t.name = '8U Boys'
    AND e.start_at::date = '2026-04-19'
    AND gr.our_score = 9 AND gr.opponent_score = 29
);

-- ----- Verification (transaction rolls back if checks fail) -----

DO $$
DECLARE
  null_count INT;
  champ_count INT;
BEGIN
  SELECT COUNT(*) INTO null_count
  FROM game_results gr
  JOIN events e ON e.id = gr.event_id
  WHERE gr.published_at IS NOT NULL AND e.opponent IS NULL;

  IF null_count > 0 THEN
    RAISE EXCEPTION 'Migration 023 incomplete: % published games still have NULL opponent', null_count;
  END IF;

  SELECT COUNT(*) INTO champ_count
  FROM events WHERE is_championship_final = true;

  IF champ_count <> 3 THEN
    RAISE EXCEPTION 'Migration 023 incorrect: expected 3 championship finals, got %', champ_count;
  END IF;
END $$;

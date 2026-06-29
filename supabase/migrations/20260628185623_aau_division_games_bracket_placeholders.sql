-- Surface bracket games (Hub Home V2): persist placeholder-sided bracket games (the championship
-- "National Green 1st Place vs 2nd Place" etc.) so they appear in the schedule with their time/court
-- and can be a team's next game. Until now the ingest dropped them (placeholder sides), throwing away
-- the time/court. We make the team FKs nullable and store the placeholder labels instead; a game has
-- a team FK OR a placeholder label per side (CHECK). is_bracket flags them.
--
-- SAFE for standings: get_public_tournament_standings INNER-JOINs both team FKs everywhere it reads
-- division_games (fin/ext_games/remaining_ext/forfeits), so null-FK placeholder games fall out
-- automatically — they never reach computeStandings or the predictor's `remaining`. Verified against
-- the live RPC definition before applying.
--
-- APPLIED to prod via MCP 2026-06-28 on Frank's go ("build out the bracket game as part of the
-- schedule with directions + weather as the next game"); mirror per AP #21.

ALTER TABLE public.division_games ALTER COLUMN home_division_team_id DROP NOT NULL;
ALTER TABLE public.division_games ALTER COLUMN away_division_team_id DROP NOT NULL;
ALTER TABLE public.division_games ADD COLUMN IF NOT EXISTS home_placeholder_label text;
ALTER TABLE public.division_games ADD COLUMN IF NOT EXISTS away_placeholder_label text;
ALTER TABLE public.division_games ADD COLUMN IF NOT EXISTS is_bracket boolean NOT NULL DEFAULT false;

-- each side must resolve to a team OR carry a placeholder label — never an empty side (no fabrication)
ALTER TABLE public.division_games DROP CONSTRAINT IF EXISTS division_games_home_side_present;
ALTER TABLE public.division_games ADD CONSTRAINT division_games_home_side_present
  CHECK (home_division_team_id IS NOT NULL OR home_placeholder_label IS NOT NULL);
ALTER TABLE public.division_games DROP CONSTRAINT IF EXISTS division_games_away_side_present;
ALTER TABLE public.division_games ADD CONSTRAINT division_games_away_side_present
  CHECK (away_division_team_id IS NOT NULL OR away_placeholder_label IS NOT NULL);

COMMENT ON COLUMN public.division_games.home_placeholder_label IS 'TM seed/placeholder label when the home side is an unresolved bracket seed (team FK null); e.g. "National Green 1st Place".';
COMMENT ON COLUMN public.division_games.away_placeholder_label IS 'TM seed/placeholder label when the away side is an unresolved bracket seed (team FK null).';
COMMENT ON COLUMN public.division_games.is_bracket IS 'Bracket/elimination game (vs pool play). Placeholder-sided bracket games are persisted for schedule display but excluded from standings via the standings RPC inner joins.';

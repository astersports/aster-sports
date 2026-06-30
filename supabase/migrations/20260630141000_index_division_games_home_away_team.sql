-- The schedule / bracket / standings RPCs filter division_games by
-- home_division_team_id and away_division_team_id (a team's games are
-- WHERE home_division_team_id = tt.id OR away_division_team_id = tt.id), but
-- neither column was indexed — so every team-schedule lookup seq-scans the
-- games table. Cheap now (7k rows), unbounded later. Add a btree on each.
CREATE INDEX IF NOT EXISTS idx_division_games_home_team
  ON public.division_games (home_division_team_id);
CREATE INDEX IF NOT EXISTS idx_division_games_away_team
  ON public.division_games (away_division_team_id);

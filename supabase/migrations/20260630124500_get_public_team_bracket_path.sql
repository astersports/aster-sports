-- Public, anon-callable bracket "playoff path" for a tracked team's LIVE/upcoming
-- tournaments (R1·PR-A). For each division the team is in (end_date >= today), it
-- returns the WHOLE division bracket — every bracket game including ones the team
-- hasn't reached yet, with placeholder sides ("Bracket Winner B1", "Boys 5/6 1st
-- Place") — so a parent sees the full weekend path before it's played. PII-free;
-- gated by org_is_public_listed. Mirrors get_public_aau_team_schedule's teamKey
-- resolution + org gate. Applied to prod via MCP 2026-06-30 (mirror per AP #21).

CREATE OR REPLACE FUNCTION public.get_public_team_bracket_path(p_team_ids text[])
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH my_divs AS (
    SELECT DISTINCT d.id AS division_id, d.name AS division_name,
           t.id AS tournament_id, t.name AS tournament_name, t.end_date,
           tt.id AS my_team_id, tt.display_name AS my_team_name
    FROM tournament_division_teams tt
    JOIN tournament_divisions d ON d.id = tt.tournament_division_id
    JOIN tournaments t ON t.id = d.tournament_id
    WHERE (
        public.aau_qkey(tt.resolved_key, d.gender, d.grade_label, d.grade_min, d.grade_max) = any (p_team_ids)
        OR lower(tt.resolved_key) = any (array(select lower(k) from unnest(p_team_ids) as k))
        OR tt.external_team_key = any (p_team_ids)
        OR tt.id::text = any (p_team_ids)
      )
      AND t.archived_at IS NULL
      AND t.end_date >= current_date
      AND public.org_is_public_listed(t.org_id)
  )
  SELECT coalesce(jsonb_agg(path.row ORDER BY path.tournament_name, path.division_name), '[]'::jsonb)
  FROM (
    SELECT m.tournament_name, m.division_name,
      jsonb_build_object(
        'tournamentId', m.tournament_id, 'tournament', m.tournament_name,
        'division', m.division_name, 'teamName', m.my_team_name,
        'games', (
          SELECT jsonb_agg(jsonb_build_object(
            'gameCode', dg.external_game_id,
            'home', coalesce(h.display_name, dg.home_placeholder_label),
            'away', coalesce(a.display_name, dg.away_placeholder_label),
            'homeIsMine', dg.home_division_team_id = m.my_team_id,
            'awayIsMine', dg.away_division_team_id = m.my_team_id,
            'startAt', dg.start_at, 'court', dg.court,
            'homeScore', dg.home_score, 'awayScore', dg.away_score, 'status', dg.status
          ) ORDER BY dg.start_at NULLS LAST, dg.external_game_id)
          FROM division_games dg
          LEFT JOIN tournament_division_teams h ON h.id = dg.home_division_team_id
          LEFT JOIN tournament_division_teams a ON a.id = dg.away_division_team_id
          WHERE dg.tournament_division_id = m.division_id AND dg.is_bracket
        )
      ) AS row
    FROM my_divs m
  ) path
  WHERE path.row->'games' IS NOT NULL AND jsonb_array_length(path.row->'games') > 0;
$$;

REVOKE EXECUTE ON FUNCTION public.get_public_team_bracket_path(text[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_team_bracket_path(text[]) TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_team_bracket_path(text[]) TO authenticated;

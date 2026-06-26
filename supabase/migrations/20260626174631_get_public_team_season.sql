-- AAU family hub: a team's spring season across tournaments — powers the real-data
-- kid view (each kid → their team's per-tournament record + the division to drill
-- into). AP #21 mirror of the prod-applied migration. Public, org_is_public_listed-
-- gated. p_team_name is an ILIKE; p_division_like narrows by division (e.g. '%Girls%'
-- for a club that fields multiple teams under one display name). Per-game-capped diff
-- via circuit_rules (same rule as the standings engine).
CREATE OR REPLACE FUNCTION public.get_public_team_season(
  p_org_id uuid, p_team_name text, p_division_like text DEFAULT NULL
)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH mine AS (
    SELECT dt.id AS team_id, dt.resolved_key, dt.display_name,
           d.id AS division_id, d.name AS division_name, d.circuit,
           t.name AS tournament_name, t.start_date, t.end_date,
           cr.point_differential_cap AS cap,
           (SELECT count(*) FROM public.tournament_division_teams x WHERE x.tournament_division_id = d.id) AS team_count
    FROM public.tournament_division_teams dt
    JOIN public.tournament_divisions d ON d.id = dt.tournament_division_id
    JOIN public.tournaments t ON t.id = d.tournament_id
    LEFT JOIN public.circuit_rules cr ON cr.org_id = t.org_id AND cr.circuit_name = d.circuit
    WHERE t.org_id = p_org_id AND public.org_is_public_listed(t.org_id) AND t.archived_at IS NULL
      AND dt.display_name ILIKE p_team_name
      AND (p_division_like IS NULL OR d.name ILIKE p_division_like)
  ),
  agg AS (
    SELECT m.division_id,
      sum(CASE WHEN (g.home_division_team_id = m.team_id AND g.home_score > g.away_score)
                 OR (g.away_division_team_id = m.team_id AND g.away_score > g.home_score) THEN 1 ELSE 0 END) AS wins,
      sum(CASE WHEN (g.home_division_team_id = m.team_id AND g.home_score < g.away_score)
                 OR (g.away_division_team_id = m.team_id AND g.away_score < g.home_score) THEN 1 ELSE 0 END) AS losses,
      sum(CASE WHEN g.home_division_team_id = m.team_id
               THEN greatest(-coalesce(m.cap, 1000000), least(coalesce(m.cap, 1000000), g.home_score - g.away_score))
               ELSE greatest(-coalesce(m.cap, 1000000), least(coalesce(m.cap, 1000000), g.away_score - g.home_score)) END) AS diff,
      count(*) AS gp
    FROM mine m
    JOIN public.division_games g ON g.tournament_division_id = m.division_id
      AND g.status = 'final' AND g.home_score IS NOT NULL AND g.away_score IS NOT NULL
      AND (g.home_division_team_id = m.team_id OR g.away_division_team_id = m.team_id)
    GROUP BY m.division_id
  )
  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'tournament', m.tournament_name, 'startDate', m.start_date, 'endDate', m.end_date,
    'division', m.division_name, 'divisionId', m.division_id, 'circuit', m.circuit,
    'teamKey', m.resolved_key, 'teamCount', m.team_count,
    'wins', coalesce(a.wins, 0), 'losses', coalesce(a.losses, 0),
    'diff', coalesce(a.diff, 0), 'gamesPlayed', coalesce(a.gp, 0)
  ) ORDER BY m.start_date), '[]'::jsonb)
  FROM mine m LEFT JOIN agg a ON a.division_id = m.division_id;
$function$;

REVOKE EXECUTE ON FUNCTION public.get_public_team_season(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_team_season(uuid, text, text) TO anon, authenticated;

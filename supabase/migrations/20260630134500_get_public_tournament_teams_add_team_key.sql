-- Add team_key to each team in get_public_tournament_teams so the no-login Hub
-- tournament -> division -> team drill-down can link straight to that team's
-- public schedule. team_key uses the SAME aau_qkey() the schedule RPC matches on
-- (get_public_aau_team_schedule), so the link resolves identically to a search
-- result or a tracked team. Adds grade_min/grade_max to the divs CTE for the key.
CREATE OR REPLACE FUNCTION public.get_public_tournament_teams(p_tournament_id uuid)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH t AS (
    SELECT tt.id, tt.name, tt.circuit, tt.start_date, tt.end_date
    FROM public.tournaments tt
    WHERE tt.id = p_tournament_id AND public.org_is_public_listed(tt.org_id) AND tt.archived_at IS NULL
  ),
  divs AS (
    SELECT td.id, td.name, td.grade_label, td.gender, td.advance_count, td.sort_order,
           td.grade_min, td.grade_max
    FROM public.tournament_divisions td JOIN t ON TRUE
    WHERE td.tournament_id = t.id
  ),
  teams AS (
    SELECT tdt.id, tdt.tournament_division_id, tdt.resolved_key, tdt.display_name, tdt.sort_order,
           (tdt.team_id IS NOT NULL) AS is_ours
    FROM public.tournament_division_teams tdt JOIN divs d ON d.id = tdt.tournament_division_id
  ),
  -- one pool per team: lowest tournament_pools.sort_order wins (stable if membership grows)
  team_pool AS (
    SELECT DISTINCT ON (pt.tournament_division_team_id)
           pt.tournament_division_team_id AS tdt_id, tp.name AS pool
    FROM public.pool_teams pt
    JOIN public.tournament_pools tp ON tp.id = pt.tournament_pool_id
    JOIN teams tm ON tm.id = pt.tournament_division_team_id
    ORDER BY pt.tournament_division_team_id, tp.sort_order, tp.name
  ),
  ext AS (
    SELECT dg.home_division_team_id AS tdt_id,
           (dg.home_score > dg.away_score)::int AS w, (dg.home_score < dg.away_score)::int AS l,
           (dg.home_score - dg.away_score) AS diff
    FROM public.division_games dg JOIN divs d ON d.id = dg.tournament_division_id
    WHERE dg.status = 'final' AND dg.home_score IS NOT NULL AND dg.away_score IS NOT NULL
    UNION ALL
    SELECT dg.away_division_team_id,
           (dg.away_score > dg.home_score)::int, (dg.away_score < dg.home_score)::int,
           (dg.away_score - dg.home_score)
    FROM public.division_games dg JOIN divs d ON d.id = dg.tournament_division_id
    WHERE dg.status = 'final' AND dg.home_score IS NOT NULL AND dg.away_score IS NOT NULL
  ),
  rec AS (
    SELECT tdt_id, SUM(w) AS wins, SUM(l) AS losses, SUM(diff) AS diff
    FROM ext GROUP BY tdt_id
  )
  SELECT CASE WHEN EXISTS (SELECT 1 FROM t) THEN jsonb_build_object(
    'tournament', (SELECT jsonb_build_object('id',id,'name',name,'circuit',circuit,'start_date',start_date,'end_date',end_date) FROM t),
    'divisions', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', d.id, 'name', d.name, 'grade_label', d.grade_label, 'gender', d.gender, 'advance_count', d.advance_count,
        'teams', COALESCE((
          SELECT jsonb_agg(jsonb_build_object(
            'id', tm.resolved_key, 'name', tm.display_name, 'pool', tp.pool,
            'team_key', public.aau_qkey(tm.resolved_key, d.gender, d.grade_label, d.grade_min, d.grade_max),
            'wins', COALESCE(r.wins,0), 'losses', COALESCE(r.losses,0), 'diff', COALESCE(r.diff,0),
            'isOurs', tm.is_ours
          ) ORDER BY COALESCE(r.wins,0) DESC, COALESCE(r.diff,0) DESC, tm.sort_order, tm.display_name)
          FROM teams tm
          LEFT JOIN team_pool tp ON tp.tdt_id = tm.id
          LEFT JOIN rec r ON r.tdt_id = tm.id
          WHERE tm.tournament_division_id = d.id
        ), '[]'::jsonb)
      ) ORDER BY d.sort_order, d.name)
      FROM divs d
    ), '[]'::jsonb)
  ) ELSE NULL END;
$function$;

-- AAU Screen 02 "Track one or many" data: every division in a tournament with its
-- grade/gender, and each team's pool + W–L record. Anon-readable, org_is_public_listed
-- gated (same public surface as the directory/standings RPCs).
--
-- Records computed from division_games (external games — the path for parent-submitted
-- directory tournaments, where every team is external). LH-hosted org tournaments whose
-- own teams play through events/game_results can extend this with an our-games union
-- later; for the public self-serve directory, external games are the complete record.
--
-- Mirror of the prod-applied migration (AP #21 — version string matches production).

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
    SELECT td.id, td.name, td.grade_label, td.gender, td.advance_count, td.sort_order
    FROM public.tournament_divisions td JOIN t ON TRUE
    WHERE td.tournament_id = t.id
  ),
  teams AS (
    SELECT tdt.id, tdt.tournament_division_id, tdt.resolved_key, tdt.display_name, tdt.sort_order,
           (tdt.team_id IS NOT NULL) AS is_ours
    FROM public.tournament_division_teams tdt JOIN divs d ON d.id = tdt.tournament_division_id
  ),
  team_pool AS (
    SELECT pt.tournament_division_team_id AS tdt_id, tp.name AS pool
    FROM public.pool_teams pt
    JOIN public.tournament_pools tp ON tp.id = pt.tournament_pool_id
    JOIN teams tm ON tm.id = pt.tournament_division_team_id
  ),
  -- one row per (team, game outcome) from final, fully-scored external games
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

REVOKE EXECUTE ON FUNCTION public.get_public_tournament_teams(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_public_tournament_teams(uuid) FROM anon;
GRANT  EXECUTE ON FUNCTION public.get_public_tournament_teams(uuid) TO anon, authenticated;

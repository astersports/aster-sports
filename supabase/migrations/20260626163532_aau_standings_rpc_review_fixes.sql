-- AAU standings RPC review fixes (PR #1103, Copilot review). AP #21 mirror of
-- the prod-applied migration. Both functions are CREATE OR REPLACE (grants
-- preserved: anon/authenticated EXECUTE, org_is_public_listed-gated).
--
--  #3 get_public_tournament_standings.remaining_our — a game must have BOTH
--     scores before it leaves `remaining`. Previously our_score alone removed
--     it, so a partial/in-progress score entry vanished from games AND remaining
--     (the predictor would silently ignore it).
--  #4 get_public_tournament_directory.team_count — pre-aggregate with a LEFT
--     JOIN + GROUP BY instead of a correlated per-division subquery (single pass).

CREATE OR REPLACE FUNCTION public.get_public_tournament_standings(p_division_id uuid)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH d AS (
    SELECT td.* FROM public.tournament_divisions td
    WHERE td.id = p_division_id AND public.org_is_public_listed(td.org_id)
  ),
  cap AS (
    SELECT cr.point_differential_cap FROM d
    LEFT JOIN public.circuit_rules cr ON cr.org_id = d.org_id AND cr.circuit_name = d.circuit
  ),
  units AS (
    SELECT tdt.id, tdt.resolved_key, tdt.display_name, (tdt.team_id IS NOT NULL) AS is_ours
    FROM public.tournament_division_teams tdt JOIN d ON d.id = tdt.tournament_division_id
  ),
  our_games AS (
    SELECT me.resolved_key AS a_key, opp.resolved_key AS b_key, gr.our_score AS a_score, gr.opponent_score AS b_score
    FROM public.events e
    JOIN d ON d.id = e.tournament_division_id
    JOIN public.game_results gr ON gr.event_id = e.id AND gr.published_at IS NOT NULL
    JOIN public.tournament_division_teams me ON me.tournament_division_id = d.id AND me.team_id = e.team_id
    LEFT JOIN public.tournament_division_teams opp ON opp.tournament_division_id = d.id
      AND ((e.opponent_id IS NOT NULL AND opp.opponent_id = e.opponent_id)
        OR (e.opponent_id IS NULL AND lower(btrim(opp.display_name)) = lower(btrim(e.opponent))))
    WHERE gr.our_score IS NOT NULL AND gr.opponent_score IS NOT NULL
  ),
  ext_games AS (
    SELECT h.resolved_key AS a_key, a.resolved_key AS b_key, dg.home_score AS a_score, dg.away_score AS b_score
    FROM public.division_games dg
    JOIN d ON d.id = dg.tournament_division_id
    JOIN public.tournament_division_teams h ON h.id = dg.home_division_team_id
    JOIN public.tournament_division_teams a ON a.id = dg.away_division_team_id
    WHERE dg.status = 'final' AND dg.home_score IS NOT NULL AND dg.away_score IS NOT NULL
  ),
  all_games AS (
    SELECT * FROM our_games WHERE b_key IS NOT NULL
    UNION ALL SELECT * FROM ext_games
  ),
  remaining_our AS (
    SELECT me.resolved_key AS a_key, opp.resolved_key AS b_key
    FROM public.events e
    JOIN d ON d.id = e.tournament_division_id
    JOIN public.tournament_division_teams me ON me.tournament_division_id = d.id AND me.team_id = e.team_id
    LEFT JOIN public.tournament_division_teams opp ON opp.tournament_division_id = d.id
      AND ((e.opponent_id IS NOT NULL AND opp.opponent_id = e.opponent_id)
        OR (e.opponent_id IS NULL AND lower(btrim(opp.display_name)) = lower(btrim(e.opponent))))
    WHERE e.publish_status = 'published'
      AND NOT EXISTS (
        SELECT 1 FROM public.game_results gr
        WHERE gr.event_id = e.id AND gr.published_at IS NOT NULL
          AND gr.our_score IS NOT NULL AND gr.opponent_score IS NOT NULL
      )
  ),
  remaining_ext AS (
    SELECT h.resolved_key AS a_key, a.resolved_key AS b_key
    FROM public.division_games dg
    JOIN d ON d.id = dg.tournament_division_id
    JOIN public.tournament_division_teams h ON h.id = dg.home_division_team_id
    JOIN public.tournament_division_teams a ON a.id = dg.away_division_team_id
    WHERE dg.status IN ('scheduled','live')
  ),
  remaining_all AS (
    SELECT * FROM remaining_our WHERE b_key IS NOT NULL
    UNION ALL SELECT * FROM remaining_ext
  )
  SELECT CASE WHEN EXISTS (SELECT 1 FROM d) THEN jsonb_build_object(
    'division', jsonb_build_object('id',(SELECT id FROM d),'name',(SELECT name FROM d),'circuit',(SELECT circuit FROM d),'advance_count',(SELECT advance_count FROM d)),
    'rules', jsonb_build_object('pointDiffCap',(SELECT point_differential_cap FROM cap),'tiebreakers',jsonb_build_array('head_to_head','point_diff')),
    'teams', COALESCE((SELECT jsonb_agg(jsonb_build_object('id',resolved_key,'name',display_name,'isOurs',is_ours)) FROM units), '[]'::jsonb),
    'games', COALESCE((SELECT jsonb_agg(jsonb_build_object('aId',a_key,'bId',b_key,'aScore',a_score,'bScore',b_score)) FROM all_games), '[]'::jsonb),
    'remaining', COALESCE((SELECT jsonb_agg(jsonb_build_object('aId',a_key,'bId',b_key)) FROM remaining_all), '[]'::jsonb)
  ) ELSE NULL END;
$function$;

CREATE OR REPLACE FUNCTION public.get_public_tournament_directory()
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH t AS (
    SELECT tt.id, tt.org_id, tt.name, tt.circuit, tt.start_date, tt.end_date
    FROM public.tournaments tt
    WHERE public.org_is_public_listed(tt.org_id)
      AND tt.archived_at IS NULL
  ),
  divs AS (
    SELECT td.tournament_id, td.id, td.name, td.grade_label, td.gender, td.advance_count, td.sort_order,
           count(x.id) AS team_count
    FROM public.tournament_divisions td
    JOIN t ON t.id = td.tournament_id
    LEFT JOIN public.tournament_division_teams x ON x.tournament_division_id = td.id
    GROUP BY td.tournament_id, td.id, td.name, td.grade_label, td.gender, td.advance_count, td.sort_order
  )
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', t.id, 'name', t.name, 'circuit', t.circuit,
    'start_date', t.start_date, 'end_date', t.end_date,
    'divisions', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', d.id, 'name', d.name, 'grade_label', d.grade_label, 'gender', d.gender,
        'advance_count', d.advance_count, 'team_count', d.team_count) ORDER BY d.sort_order, d.name)
      FROM divs d WHERE d.tournament_id = t.id), '[]'::jsonb)
  ) ORDER BY t.start_date DESC), '[]'::jsonb)
  FROM t;
$function$;

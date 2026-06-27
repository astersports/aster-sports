-- Fold a cross-tournament strength rating into each team in the standings bundle, so the
-- bracket predictor can weight remaining games by real team strength instead of a 50/50
-- coin-flip. Rating = opponent-adjusted average point margin (margin capped ±25): a team's
-- own avg margin plus its opponents' avg margins (one strength-of-schedule pass), aggregated
-- across EVERY public tournament by the stable resolved_key. Null when a team has no finals
-- anywhere. Pure read; same security/gating as before.
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
  ratings AS (
    WITH fin AS (
      SELECT th.resolved_key AS hk, ta.resolved_key AS ak,
             greatest(-25, least(25, dg.home_score - dg.away_score)) AS m
      FROM public.division_games dg
      JOIN public.tournament_divisions dd ON dd.id = dg.tournament_division_id
      JOIN public.tournaments tt ON tt.id = dd.tournament_id
      JOIN public.tournament_division_teams th ON th.id = dg.home_division_team_id
      JOIN public.tournament_division_teams ta ON ta.id = dg.away_division_team_id
      WHERE dg.status = 'final' AND dg.home_score IS NOT NULL AND dg.away_score IS NOT NULL
        AND public.org_is_public_listed(tt.org_id)
        AND th.resolved_key IS NOT NULL AND ta.resolved_key IS NOT NULL
    ),
    long AS (
      SELECT hk AS team, ak AS opp, m FROM fin
      UNION ALL
      SELECT ak AS team, hk AS opp, -m FROM fin
    ),
    raw AS (SELECT team, avg(m) AS rm, count(*) AS gp FROM long GROUP BY team)
    SELECT l.team AS rkey,
           round((r.rm + COALESCE(avg(ro.rm), 0))::numeric, 2) AS rating,
           r.gp
    FROM long l
    JOIN raw r ON r.team = l.team
    LEFT JOIN raw ro ON ro.team = l.opp
    WHERE l.team IN (SELECT resolved_key FROM units)
    GROUP BY l.team, r.rm, r.gp
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
    'teams', COALESCE((SELECT jsonb_agg(jsonb_build_object('id',u.resolved_key,'name',u.display_name,'isOurs',u.is_ours,'rating',rt.rating,'gp',COALESCE(rt.gp,0))) FROM units u LEFT JOIN ratings rt ON rt.rkey = u.resolved_key), '[]'::jsonb),
    'games', COALESCE((SELECT jsonb_agg(jsonb_build_object('aId',a_key,'bId',b_key,'aScore',a_score,'bScore',b_score)) FROM all_games), '[]'::jsonb),
    'remaining', COALESCE((SELECT jsonb_agg(jsonb_build_object('aId',a_key,'bId',b_key)) FROM remaining_all), '[]'::jsonb)
  ) ELSE NULL END;
$function$;

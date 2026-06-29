-- Add per-game isForfeit to the standings 'games' array so the team-detail "Their games"
-- list renders a forfeit honestly ("forfeit") instead of the awarded 20-0. ADDITIVE ONLY:
-- the W-L-DIFF math (fin/long/team_stats) and the team-level 'isForfeit' are untouched; this
-- only stamps each row in the 'games' output. our_games (game_results) carry false; ext_games
-- (division_games) carry dg.is_forfeit. APPLIED via MCP 2026-06-29; mirror per AP #21.
CREATE OR REPLACE FUNCTION public.get_public_tournament_standings(p_division_id uuid)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH d AS (
    SELECT td.* FROM public.tournament_divisions td
    WHERE td.id = p_division_id AND public.org_is_public_listed(td.org_id)
  ), cap AS (
    SELECT (cr.id IS NOT NULL) AS circuit_matched, cr.point_differential_cap AS circuit_cap
    FROM d LEFT JOIN public.circuit_rules cr ON cr.org_id = d.org_id AND cr.circuit_name = d.circuit
  ), units AS (
    SELECT tdt.id, tdt.external_team_key AS key, tdt.display_name, (tdt.team_id IS NOT NULL) AS is_ours
    FROM public.tournament_division_teams tdt JOIN d ON d.id = tdt.tournament_division_id
  ), fin AS (
    SELECT th.external_team_key AS hk, ta.external_team_key AS ak, dg.home_score AS hs, dg.away_score AS as_,
      (dg.home_score - dg.away_score) AS real_m,
      CASE WHEN (SELECT circuit_matched FROM cap) AND (SELECT circuit_cap FROM cap) IS NULL
        THEN (dg.home_score - dg.away_score)
        ELSE greatest(-COALESCE((SELECT circuit_cap FROM cap), 20), least(COALESCE((SELECT circuit_cap FROM cap), 20), dg.home_score - dg.away_score)) END AS cap_m
    FROM public.division_games dg
    JOIN d ON d.id = dg.tournament_division_id
    JOIN public.tournament_division_teams th ON th.id = dg.home_division_team_id
    JOIN public.tournament_division_teams ta ON ta.id = dg.away_division_team_id
    WHERE dg.status = 'final' AND dg.home_score IS NOT NULL AND dg.away_score IS NOT NULL AND NOT dg.is_exhibition
      AND th.external_team_key IS NOT NULL AND ta.external_team_key IS NOT NULL
  ), long AS (
    SELECT hk AS team, ak AS opp, hs AS my_s, as_ AS opp_s, real_m, cap_m FROM fin
    UNION ALL
    SELECT ak AS team, hk AS opp, as_ AS my_s, hs AS opp_s, -real_m, -cap_m FROM fin
  ), team_stats AS (
    SELECT team, count(*) FILTER (WHERE my_s > opp_s) AS wins, count(*) FILTER (WHERE my_s < opp_s) AS losses,
      sum(my_s)::int AS points_for, sum(opp_s)::int AS points_against,
      sum(real_m)::int AS real_point_diff, sum(cap_m)::int AS capped_point_diff, count(*) AS gp
    FROM long GROUP BY team
  ), raw AS (SELECT team, avg(cap_m) AS rm FROM long GROUP BY team), ratings AS (
    SELECT l.team AS rkey, round((r.rm + COALESCE(avg(ro.rm), 0))::numeric, 2) AS rating
    FROM long l JOIN raw r ON r.team = l.team LEFT JOIN raw ro ON ro.team = l.opp
    WHERE l.team IN (SELECT key FROM units) GROUP BY l.team, r.rm
  ), forfeits AS (
    SELECT t.external_team_key AS team_key
    FROM public.division_games dg JOIN d ON d.id = dg.tournament_division_id
    JOIN public.tournament_division_teams t ON t.id IN (dg.home_division_team_id, dg.away_division_team_id)
    WHERE dg.is_forfeit AND NOT dg.is_exhibition AND t.external_team_key IS NOT NULL GROUP BY t.external_team_key
  ), our_games AS (
    SELECT me.external_team_key AS a_key, opp.external_team_key AS b_key, gr.our_score AS a_score, gr.opponent_score AS b_score, false AS is_forfeit
    FROM public.events e JOIN d ON d.id = e.tournament_division_id
    JOIN public.game_results gr ON gr.event_id = e.id AND gr.published_at IS NOT NULL
    JOIN public.tournament_division_teams me ON me.tournament_division_id = d.id AND me.team_id = e.team_id
    LEFT JOIN public.tournament_division_teams opp ON opp.tournament_division_id = d.id
      AND ((e.opponent_id IS NOT NULL AND opp.opponent_id = e.opponent_id) OR (e.opponent_id IS NULL AND lower(btrim(opp.display_name)) = lower(btrim(e.opponent))))
    WHERE gr.our_score IS NOT NULL AND gr.opponent_score IS NOT NULL
  ), ext_games AS (
    SELECT h.external_team_key AS a_key, a.external_team_key AS b_key, dg.home_score AS a_score, dg.away_score AS b_score, dg.is_forfeit AS is_forfeit
    FROM public.division_games dg JOIN d ON d.id = dg.tournament_division_id
    JOIN public.tournament_division_teams h ON h.id = dg.home_division_team_id
    JOIN public.tournament_division_teams a ON a.id = dg.away_division_team_id
    WHERE dg.status = 'final' AND dg.home_score IS NOT NULL AND dg.away_score IS NOT NULL AND NOT dg.is_exhibition
  ), all_games AS (
    SELECT * FROM our_games WHERE b_key IS NOT NULL
    UNION ALL
    SELECT * FROM ext_games
  ), remaining_our AS (
    SELECT me.external_team_key AS a_key, opp.external_team_key AS b_key
    FROM public.events e JOIN d ON d.id = e.tournament_division_id
    JOIN public.tournament_division_teams me ON me.tournament_division_id = d.id AND me.team_id = e.team_id
    LEFT JOIN public.tournament_division_teams opp ON opp.tournament_division_id = d.id
      AND ((e.opponent_id IS NOT NULL AND opp.opponent_id = e.opponent_id) OR (e.opponent_id IS NULL AND lower(btrim(opp.display_name)) = lower(btrim(e.opponent))))
    WHERE e.publish_status = 'published' AND NOT EXISTS (
      SELECT 1 FROM public.game_results gr WHERE gr.event_id = e.id AND gr.published_at IS NOT NULL AND gr.our_score IS NOT NULL AND gr.opponent_score IS NOT NULL)
  ), remaining_ext AS (
    SELECT h.external_team_key AS a_key, a.external_team_key AS b_key
    FROM public.division_games dg JOIN d ON d.id = dg.tournament_division_id
    JOIN public.tournament_division_teams h ON h.id = dg.home_division_team_id
    JOIN public.tournament_division_teams a ON a.id = dg.away_division_team_id
    WHERE dg.status IN ('scheduled','live') AND NOT dg.is_exhibition
  ), remaining_all AS (
    SELECT * FROM remaining_our WHERE b_key IS NOT NULL UNION ALL SELECT * FROM remaining_ext
  )
  SELECT CASE WHEN EXISTS (SELECT 1 FROM d) THEN jsonb_build_object(
    'division', jsonb_build_object('id',(SELECT id FROM d),'name',(SELECT name FROM d),'circuit',(SELECT circuit FROM d),'advance_count',(SELECT advance_count FROM d)),
    'rules', jsonb_build_object(
      'pointDiffCap', CASE WHEN (SELECT circuit_matched FROM cap) THEN (SELECT circuit_cap FROM cap) ELSE 20 END,
      'tiebreakers', jsonb_build_array('head_to_head','capped_point_diff','points_allowed','points_scored')),
    'teams', COALESCE((SELECT jsonb_agg(jsonb_build_object(
      'id',u.key,'name',u.display_name,'isOurs',u.is_ours,
      'rating',rt.rating,'gp',COALESCE(ts.gp,0),
      'wins',COALESCE(ts.wins,0),'losses',COALESCE(ts.losses,0),
      'pointsFor',COALESCE(ts.points_for,0),'pointsAgainst',COALESCE(ts.points_against,0),
      'realPointDiff',COALESCE(ts.real_point_diff,0),'cappedPointDiff',COALESCE(ts.capped_point_diff,0),
      'isForfeit',(f.team_key IS NOT NULL)
    )) FROM units u LEFT JOIN ratings rt ON rt.rkey = u.key LEFT JOIN team_stats ts ON ts.team = u.key LEFT JOIN forfeits f ON f.team_key = u.key), '[]'::jsonb),
    'games', COALESCE((SELECT jsonb_agg(jsonb_build_object('aId',a_key,'bId',b_key,'aScore',a_score,'bScore',b_score,'isForfeit',is_forfeit)) FROM all_games), '[]'::jsonb),
    'remaining', COALESCE((SELECT jsonb_agg(jsonb_build_object('aId',a_key,'bId',b_key)) FROM remaining_all), '[]'::jsonb)
  ) ELSE NULL END;
$function$;

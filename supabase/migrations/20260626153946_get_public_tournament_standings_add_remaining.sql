-- Extend the public standings RPC to also return REMAINING (unplayed) games so the
-- D-FV5 predictor (src/lib/standings/predictBracket.js) can enumerate outcomes for the
-- bracket-odds. remaining = our published events with no final result + external
-- division_games not yet final; no scores; same UNION + identity mapping as `games`.
-- Owner-approved (build R1/R2) + MCP-applied 2026-06-26.
CREATE OR REPLACE FUNCTION public.get_public_tournament_standings(p_division_id uuid)
RETURNS jsonb LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $fn$
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
      AND NOT EXISTS (SELECT 1 FROM public.game_results gr WHERE gr.event_id = e.id AND gr.published_at IS NOT NULL AND gr.our_score IS NOT NULL)
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
$fn$;
REVOKE EXECUTE ON FUNCTION public.get_public_tournament_standings(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_public_tournament_standings(uuid) FROM anon;
GRANT  EXECUTE ON FUNCTION public.get_public_tournament_standings(uuid) TO anon, authenticated;

-- ============================================================================
-- STANDINGS POINT-DIFFERENTIAL CAP: default 25 → 20  (APPLIED 2026-06-27 on Frank's apply-go)
--
-- APPLIED to prod vrwwpsbfbnveawqwbdmj via MCP 2026-06-27 (canonical version
--   20260627234848 = this filename). Verified post-apply: a live Grand Finale
--   division with a 20+ blowout final now reports rules.pointDiffCap = 20.
--
-- VENDOR-CONFIRMED: Zero Gravity official rules — "The maximum point differential
--   a team can gain from a single game is 20 points. For any score difference over
--   20 points that team will still receive a +20 PD." [GROUNDED]
--
-- OPERATOR DIRECTIVE (2026-06-27): "Regardless of the score, the most points a
--   team can win/lose by is 20 points in the standings. The official score is
--   48-8, but the standings is +20 for the winning team and -20 for the losing
--   team to keep it close for advancing."
--
-- GROUNDING (prod vrwwpsbfbnveawqwbdmj, 2026-06-27):
--   - circuit_rules HAS the right value: ('AAU Zero Gravity', cap = 20) for the
--     Legacy Hoopers org. But tournament_divisions.circuit is NULL on ALL 317
--     rows, so the standings join `cr.circuit_name = d.circuit` NEVER matches and
--     the COALESCE default governs every division. That default was 25 (carried
--     over from the A2 re-grain), so the LIVE cap is 25 — not the intended 20.
--   - The TourneyMachine scraper does not populate divisions.circuit, so wiring
--     the cap through circuit_rules would require backfilling circuit on every
--     scraped division (fragile, scraper re-imports would re-null it). Changing
--     the universal default to 20 matches the operator's universal rule directly
--     and needs no per-division data. The circuit_rules override still applies
--     when a division's circuit IS set, and it already agrees (Zero Gravity = 20).
--
-- WHAT CHANGES: exactly one value — COALESCE(cr.point_differential_cap, 25) → 20.
--   The cap is applied as greatest(-pdc, least(pdc, home-away)) on each final's
--   margin, so a 48-8 game contributes margin +20 / -20 to the ratings. Output
--   shape unchanged; the rules.pointDiffCap field now reports 20.
--
-- GOVERNANCE: CREATE OR REPLACE of an existing public read RPC → A1 stage-and-hold.
--   NOT applied by CC. Apply via MCP on Frank's explicit apply-go; the canonical
--   version string is confirmed at apply time (this filename is the staged name).
-- RE-TEST AFTER APPLY: SELECT get_public_tournament_standings('<a-final-division>')
--   and confirm rules.pointDiffCap = 20 and a known blowout's margin is capped at 20.
-- ============================================================================

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
    -- circuit point-diff cap; default 20 when the circuit is uncapped/unmatched
    -- (operator rule 2026-06-27: ±20 max margin in standings, regardless of score)
    SELECT COALESCE(cr.point_differential_cap, 20) AS pdc
    FROM d
    LEFT JOIN public.circuit_rules cr ON cr.org_id = d.org_id AND cr.circuit_name = d.circuit
  ),
  units AS (
    SELECT tdt.id, tdt.external_team_key AS key, tdt.display_name, (tdt.team_id IS NOT NULL) AS is_ours
    FROM public.tournament_division_teams tdt JOIN d ON d.id = tdt.tournament_division_id
  ),
  ratings AS (
    WITH fin AS (
      -- SCOPED to this division only (JOIN d) — no cross-tournament scan.
      -- external_team_key. cap from circuit (default 20).
      SELECT th.external_team_key AS hk, ta.external_team_key AS ak,
             greatest(-(SELECT pdc FROM cap), least((SELECT pdc FROM cap), dg.home_score - dg.away_score)) AS m
      FROM public.division_games dg
      JOIN d ON d.id = dg.tournament_division_id
      JOIN public.tournament_division_teams th ON th.id = dg.home_division_team_id
      JOIN public.tournament_division_teams ta ON ta.id = dg.away_division_team_id
      WHERE dg.status = 'final' AND dg.home_score IS NOT NULL AND dg.away_score IS NOT NULL
        AND th.external_team_key IS NOT NULL AND ta.external_team_key IS NOT NULL
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
    WHERE l.team IN (SELECT key FROM units)
    GROUP BY l.team, r.rm, r.gp
  ),
  our_games AS (
    SELECT me.external_team_key AS a_key, opp.external_team_key AS b_key, gr.our_score AS a_score, gr.opponent_score AS b_score
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
    SELECT h.external_team_key AS a_key, a.external_team_key AS b_key, dg.home_score AS a_score, dg.away_score AS b_score
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
    SELECT me.external_team_key AS a_key, opp.external_team_key AS b_key
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
    SELECT h.external_team_key AS a_key, a.external_team_key AS b_key
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
    'rules', jsonb_build_object('pointDiffCap',(SELECT pdc FROM cap),'tiebreakers',jsonb_build_array('head_to_head','point_diff')),
    'teams', COALESCE((SELECT jsonb_agg(jsonb_build_object('id',u.key,'name',u.display_name,'isOurs',u.is_ours,'rating',rt.rating,'gp',COALESCE(rt.gp,0))) FROM units u LEFT JOIN ratings rt ON rt.rkey = u.key), '[]'::jsonb),
    'games', COALESCE((SELECT jsonb_agg(jsonb_build_object('aId',a_key,'bId',b_key,'aScore',a_score,'bScore',b_score)) FROM all_games), '[]'::jsonb),
    'remaining', COALESCE((SELECT jsonb_agg(jsonb_build_object('aId',a_key,'bId',b_key)) FROM remaining_all), '[]'::jsonb)
  ) ELSE NULL END;
$function$;

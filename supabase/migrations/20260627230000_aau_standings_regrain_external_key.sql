-- ============================================================================
-- A2 — STANDINGS RE-GRAIN: resolved_key → external_team_key  (STAGED · HELD)
-- Architect-ratified 2026-06-27 (ARCHITECT_DECISION_RULINGS A2, option 1 full re-grain).
--
-- ⛔ NOT YET APPLIED. This is STAGED for Frank's explicit apply-go (gate B3). Per the
--    apply-gate discipline this is a CREATE OR REPLACE of an existing function (NOT a
--    brand-new additive read), so it stage-and-holds regardless of the A1 narrow
--    exception. On apply via MCP, rename to the canonical production version string
--    (AP #21) and run the re-test below before declaring done.
--
-- WHY (grounded against prod vrwwpsbfbnveawqwbdmj, 2026-06-27):
--   - tournament_division_teams: 3,086 rows, 1,799 distinct resolved_key (1,287
--     collisions); external_team_key is 3,017 distinct / 3,086, 100% populated, clean.
--   - GROUNDING NUANCE: NO division has WITHIN-division resolved_key collisions, so the
--     per-division W-L/ordering was already correct. The damage is in the RATINGS: the
--     `fin` CTE scanned EVERY public tournament's finals keyed by the name-slug
--     resolved_key, so a team's strength prior pulled in unrelated same-name teams'
--     games across tournaments (the "legacy hoopers = 14 teams" class of leak). Those
--     contaminated ratings drove the uncalibrated odds suppressed in #159.
--
-- WHAT THIS CHANGES (architect A2 scope i–iv):
--   (i)  external_team_key replaces resolved_key THROUGHOUT (units, fin, our/ext games,
--        remaining, and the output ids).
--   (ii) The ratings `fin` scan is SCOPED TO THIS DIVISION (JOIN d) — no more unfiltered
--        cross-tournament scan; a team's rating uses only this division's finals.
--   (iii) R-CAP: the margin cap reads the circuit's point_differential_cap (default 25
--        only when NULL), replacing the hardcoded ±25. The ±25-vs-table-20 inconsistency
--        goes away (Zero Gravity = ±20).
--   Output SHAPE is unchanged (ids stay opaque strings the predictor keys on), so the
--   frontend predictor needs no change — distinct teams simply stop collapsing.
--
-- RE-TEST BEFORE DECLARING DONE (architect A2 iv, run post-apply):
--   For a sample of divisions, verify post-re-grain team W-L + ordering match the
--   official bracket/standings, and that each team's `gp` now equals its in-division
--   game count (not an inflated cross-tournament count).
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
    -- (iii) circuit point-diff cap, default 25 when the circuit is uncapped (NULL)
    SELECT COALESCE(cr.point_differential_cap, 25) AS pdc
    FROM d
    LEFT JOIN public.circuit_rules cr ON cr.org_id = d.org_id AND cr.circuit_name = d.circuit
  ),
  units AS (
    SELECT tdt.id, tdt.external_team_key AS key, tdt.display_name, (tdt.team_id IS NOT NULL) AS is_ours
    FROM public.tournament_division_teams tdt JOIN d ON d.id = tdt.tournament_division_id
  ),
  ratings AS (
    WITH fin AS (
      -- (ii) SCOPED to this division only (JOIN d) — no cross-tournament scan.
      -- (i) external_team_key. (iii) cap from circuit.
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

-- ============================================================================
-- TRACK 0 — get_public_tournament_standings : public SECDEF RPC (OQ3 + OQ6)
-- DRAFT FOR ARCHITECT/OWNER REVIEW — *** NOT APPLIED ***
-- ============================================================================
-- Ships with the D-FV4 engine. Returns the INPUTS the JS engine needs (teams +
-- games + rules + division meta) for ONE division — NOT a SQL-computed ranking.
-- The JS engine (computeStandings.js) applies the cap + tiebreakers so the
-- standings table AND the D-FV5 predictor compute from ONE source (AP #63). Doing
-- the ranking in SQL too would be a second source of the math.
--
-- OQ6 model (Option A, external-only): the games array is a UNION of
--   (1) OUR games — events + game_results scoped by events.tournament_division_id,
--       published + final, authoritative for our scores; and
--   (2) EXTERNAL games — division_games (external-vs-external only), status='final'.
-- Every game has exactly one source; no mirror, no drift.
--
-- PUBLIC posture (matches get_public_team_schedule): SECURITY DEFINER, search_path
-- public, gated by org_is_public_listed(org), PII-stripped (no child identity exists
-- in this data anyway). REVOKE PUBLIC + anon, then GRANT anon+authenticated (AP#23/#57).
--
-- [VERIFY at apply] events.opponent is TEXT (per get_public_team_schedule using
-- e.opponent). Our game's opponent is mapped to its tournament_division_team by
-- NORMALIZED-NAME match (lower(btrim(display_name)) = lower(btrim(e.opponent))) within
-- the division. If events also carries an opponent_id FK, prefer matching on that
-- (tournament_division_teams.opponent_id) and fall back to name — confirm the column
-- before apply and adjust the our_games CTE join accordingly.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_public_tournament_standings(p_division_id uuid)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $fn$
  WITH d AS (
    SELECT td.*
    FROM public.tournament_divisions td
    WHERE td.id = p_division_id
      AND public.org_is_public_listed(td.org_id)     -- the public gate
  ),
  cap AS (
    SELECT cr.point_differential_cap
    FROM d
    LEFT JOIN public.circuit_rules cr
      ON cr.org_id = d.org_id AND cr.circuit_name = d.circuit
  ),
  units AS (   -- the standings units, keyed by resolved identity
    SELECT tdt.id, tdt.resolved_key, tdt.display_name, (tdt.team_id IS NOT NULL) AS is_ours
    FROM public.tournament_division_teams tdt
    JOIN d ON d.id = tdt.tournament_division_id
  ),
  our_games AS (   -- (1) OUR games: events + game_results, published + final, authoritative
    SELECT
      me.resolved_key  AS a_key,
      opp.resolved_key AS b_key,
      gr.our_score     AS a_score,
      gr.opponent_score AS b_score
    FROM public.events e
    JOIN d ON d.id = e.tournament_division_id
    JOIN public.game_results gr ON gr.event_id = e.id AND gr.published_at IS NOT NULL
    JOIN public.tournament_division_teams me  ON me.tournament_division_id = d.id AND me.team_id = e.team_id
    LEFT JOIN public.tournament_division_teams opp
      ON opp.tournament_division_id = d.id
     AND lower(btrim(opp.display_name)) = lower(btrim(e.opponent))   -- [VERIFY] name match; prefer opponent_id if present
    WHERE gr.our_score IS NOT NULL AND gr.opponent_score IS NOT NULL
  ),
  ext_games AS (   -- (2) EXTERNAL games: division_games (external-vs-external), final only
    SELECT
      h.resolved_key AS a_key,
      a.resolved_key AS b_key,
      dg.home_score  AS a_score,
      dg.away_score  AS b_score
    FROM public.division_games dg
    JOIN d ON d.id = dg.tournament_division_id
    JOIN public.tournament_division_teams h ON h.id = dg.home_division_team_id
    JOIN public.tournament_division_teams a ON a.id = dg.away_division_team_id
    WHERE dg.status = 'final' AND dg.home_score IS NOT NULL AND dg.away_score IS NOT NULL
  ),
  all_games AS (
    SELECT * FROM our_games WHERE b_key IS NOT NULL   -- drop our games whose opponent didn't resolve (surfaced, not silently merged)
    UNION ALL
    SELECT * FROM ext_games
  )
  SELECT
    CASE WHEN EXISTS (SELECT 1 FROM d) THEN
      jsonb_build_object(
        'division', jsonb_build_object(
          'id',            (SELECT id FROM d),
          'name',          (SELECT name FROM d),
          'circuit',       (SELECT circuit FROM d),
          'advance_count', (SELECT advance_count FROM d)   -- predictor: required-confirmed per OQ5
        ),
        'rules', jsonb_build_object(
          'pointDiffCap', (SELECT point_differential_cap FROM cap),
          'tiebreakers',  jsonb_build_array('head_to_head','point_diff')
        ),
        'teams', COALESCE((SELECT jsonb_agg(jsonb_build_object(
                    'id', resolved_key, 'name', display_name, 'isOurs', is_ours)) FROM units), '[]'::jsonb),
        'games', COALESCE((SELECT jsonb_agg(jsonb_build_object(
                    'aId', a_key, 'bId', b_key, 'aScore', a_score, 'bScore', b_score)) FROM all_games), '[]'::jsonb)
      )
    ELSE NULL END;
$fn$;

-- Public read (the portals). REVOKE PUBLIC + anon first (AP#23/#57), then grant.
REVOKE EXECUTE ON FUNCTION public.get_public_tournament_standings(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_public_tournament_standings(uuid) FROM anon;
GRANT  EXECUTE ON FUNCTION public.get_public_tournament_standings(uuid) TO anon, authenticated;

-- ============================================================================
-- CLIENT CONTRACT: the family hub calls
--   supabase.rpc('get_public_tournament_standings', { p_division_id })
-- and passes the returned { teams, games, rules, division.advance_count } straight
-- into computeStandings({ teams, games, rules, advanceCount }). The engine returns
-- the ranked table; the D-FV5 predictor reads the SAME engine output. Null result =
-- division not public / not found (render "not available").
--
-- NOTE (engine `id` keying): the engine groups by the `id` field. Here id =
-- resolved_key (id-or-normalized-name), so OUR team and its games key consistently
-- with the external board. The display name rides alongside as `name`.
-- ============================================================================

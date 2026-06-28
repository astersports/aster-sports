-- ============================================================================
-- AAU STANDINGS SUBSTRATE CORRECTNESS  (APPLIED 2026-06-28 on Frank's apply-go · canonical version 20260628023106)
-- Architect ZG ruleset spec 2026-06-27 (§1 cap / §2 tiebreak inputs / §3 exhibition / §4 forfeit).
--
-- POST-APPLY CORRECTION (same day): the three-case cap below assumed circuit_rules would match the
--   scraped divisions, but ALL scraped data lives under the public hub org ("AAU Tournaments",
--   a51e2a00-…-001) which had NO circuit_rules rows, so every hub division fell to the unmatched
--   default — regressing the operator's universal-20 rule (82 ZG + 3 League Play hit the cross-org
--   gap; 232 NULL-circuit hit the 25 default). Fixed in 20260628023908: hub-org circuit_rules added
--   (ZG 20 / League Play uncapped) AND the unmatched default restored 25 → 20. Read that migration
--   together with this one — the `25` literals here are SUPERSEDED.
--
-- Builds the correct substrate the A3 exact-status engine reads. Four corrections, all grounded:
--
-- (1) PER-CIRCUIT CAP (replaces the blunt default-20). GROUNDED: tournament_divisions.circuit is
--     NULL on all rows, but the PARENT tournaments.circuit IS populated ('AAU Zero Gravity',
--     'League Play') and matches circuit_rules.circuit_name exactly. So:
--       • backfill div.circuit ← parent tournament.circuit (one-time + forward via ingest, separate).
--       • the cap now binds per-circuit with THREE cases — matched-with-cap (ZG → 20),
--         matched-uncapped (League Play, circuit_rules cap IS NULL → NO cap), and unmatched
--         (unknown circuit → default 25). The prior COALESCE(cap,20) wrongly capped League Play.
--         BBallshootout has no circuit_rules row yet → falls to default 25 until Frank classifies it.
--
-- (2) DUAL POINT-DIFFERENTIAL (architect §1/§2). The RPC now returns BOTH per team:
--       • real_point_diff  — true aggregate margin, for DISPLAY ("+40 overall").
--       • capped_point_diff — per-game margin capped per circuit, for ORDERING ("+20 for seeding").
--     The real score is never rewritten; the cap sits beside it as a seeding rule.
--
-- (3) EXHIBITION EXCLUSION (architect §3, correctness bug independent of the re-grain). Exhibition
--     games (the '*' on TourneyMachine) must count toward NOTHING. Adds is_exhibition to
--     division_games and filters it out of every standings input. SAFE TO STAGE NOW: the flag
--     defaults false, so the filter is a no-op until the paired ingest change starts capturing the
--     '*' (today _parse.ts STRIPS and discards it at lines 78/256 — that ingest fix is the paired
--     follow-up; this migration makes the column + filter ready for it).
--
-- (4) FORFEIT → OUT (architect §4). Adds is_forfeit to division_games so the exact-status engine can
--     encode forfeit as a hard advancement exclusion (overrides a qualifying W-L). Exposed per team
--     in the output; the OUT logic itself lives in the A3 engine. Capture rides with the ingest fix.
--
-- Output adds fields; existing 'rating'/'gp' kept for predictor compat (A2). Re-test after apply:
--   a known division's W-L + ordering match the bracket; League Play shows uncapped PD; ZG capped 20.
-- ============================================================================

-- (3)+(4) additive flags — default false, so all existing standings math is unchanged until ingest
-- starts setting them. NOT NULL with default keeps the RPC filters simple.
ALTER TABLE public.division_games
  ADD COLUMN IF NOT EXISTS is_exhibition boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_forfeit    boolean NOT NULL DEFAULT false;

-- (1) one-time circuit backfill from the parent tournament (div.circuit was NULL on every row).
UPDATE public.tournament_divisions td
   SET circuit = t.circuit
  FROM public.tournaments t
 WHERE t.id = td.tournament_id
   AND td.circuit IS NULL
   AND t.circuit IS NOT NULL;

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
    -- (1) three-case cap. circuit_matched + circuit_cap drive the CASE in `capm` below.
    --   matched & cap NOT NULL -> that cap (ZG 20) · matched & cap NULL -> uncapped · unmatched -> 25
    SELECT (cr.id IS NOT NULL) AS circuit_matched, cr.point_differential_cap AS circuit_cap
    FROM d
    LEFT JOIN public.circuit_rules cr ON cr.org_id = d.org_id AND cr.circuit_name = d.circuit
  ),
  units AS (
    SELECT tdt.id, tdt.external_team_key AS key, tdt.display_name, (tdt.team_id IS NOT NULL) AS is_ours
    FROM public.tournament_division_teams tdt JOIN d ON d.id = tdt.tournament_division_id
  ),
  -- every non-exhibition final in THIS division, one row per game, real + capped margin.
  fin AS (
    SELECT th.external_team_key AS hk, ta.external_team_key AS ak,
           dg.home_score AS hs, dg.away_score AS as_,
           (dg.home_score - dg.away_score) AS real_m,
           CASE
             WHEN (SELECT circuit_matched FROM cap) AND (SELECT circuit_cap FROM cap) IS NULL
               THEN (dg.home_score - dg.away_score)  -- matched & uncapped (League Play): no cap
             ELSE greatest(-COALESCE((SELECT circuit_cap FROM cap), 25),
                           least(COALESCE((SELECT circuit_cap FROM cap), 25),
                                 dg.home_score - dg.away_score))      -- ZG 20 / unknown 25
           END AS cap_m
    FROM public.division_games dg
    JOIN d ON d.id = dg.tournament_division_id
    JOIN public.tournament_division_teams th ON th.id = dg.home_division_team_id
    JOIN public.tournament_division_teams ta ON ta.id = dg.away_division_team_id
    WHERE dg.status = 'final' AND dg.home_score IS NOT NULL AND dg.away_score IS NOT NULL
      AND NOT dg.is_exhibition                                       -- (3) exclude exhibition
      AND th.external_team_key IS NOT NULL AND ta.external_team_key IS NOT NULL
  ),
  -- both directions for per-team aggregation (team / opp / my+opp score / real+capped margin).
  long AS (
    SELECT hk AS team, ak AS opp, hs AS my_s, as_ AS opp_s, real_m, cap_m FROM fin
    UNION ALL
    SELECT ak AS team, hk AS opp, as_ AS my_s, hs AS opp_s, -real_m, -cap_m FROM fin
  ),
  -- (2) per-team tiebreak inputs the A3 engine reads.
  team_stats AS (
    SELECT team,
           count(*) FILTER (WHERE my_s > opp_s) AS wins,
           count(*) FILTER (WHERE my_s < opp_s) AS losses,
           sum(my_s)::int   AS points_for,
           sum(opp_s)::int  AS points_against,
           sum(real_m)::int AS real_point_diff,
           sum(cap_m)::int  AS capped_point_diff,
           count(*) AS gp
    FROM long GROUP BY team
  ),
  -- existing rating (predictor compat, A2) — avg capped margin + opponent adjustment.
  raw AS (SELECT team, avg(cap_m) AS rm FROM long GROUP BY team),
  ratings AS (
    SELECT l.team AS rkey,
           round((r.rm + COALESCE(avg(ro.rm), 0))::numeric, 2) AS rating
    FROM long l
    JOIN raw r ON r.team = l.team
    LEFT JOIN raw ro ON ro.team = l.opp
    WHERE l.team IN (SELECT key FROM units)
    GROUP BY l.team, r.rm
  ),
  -- forfeit per team (any non-exhibition game flagged forfeit) → engine encodes OUT.
  forfeits AS (
    SELECT t.external_team_key AS team_key
    FROM public.division_games dg
    JOIN d ON d.id = dg.tournament_division_id
    JOIN public.tournament_division_teams t ON t.id IN (dg.home_division_team_id, dg.away_division_team_id)
    WHERE dg.is_forfeit AND NOT dg.is_exhibition AND t.external_team_key IS NOT NULL
    GROUP BY t.external_team_key
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
      AND NOT dg.is_exhibition                                       -- (3) exclude exhibition
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
      AND NOT dg.is_exhibition                                       -- (3) exclude exhibition
  ),
  remaining_all AS (
    SELECT * FROM remaining_our WHERE b_key IS NOT NULL
    UNION ALL SELECT * FROM remaining_ext
  )
  SELECT CASE WHEN EXISTS (SELECT 1 FROM d) THEN jsonb_build_object(
    'division', jsonb_build_object('id',(SELECT id FROM d),'name',(SELECT name FROM d),'circuit',(SELECT circuit FROM d),'advance_count',(SELECT advance_count FROM d)),
    'rules', jsonb_build_object(
      -- pointDiffCap: the effective per-circuit cap (null = uncapped), for the seeding-label UI.
      'pointDiffCap', CASE WHEN (SELECT circuit_matched FROM cap)
                            THEN (SELECT circuit_cap FROM cap)        -- ZG 20 · League Play null(uncapped)
                            ELSE 25 END,                              -- unknown default
      'tiebreakers', jsonb_build_array('head_to_head','capped_point_diff','points_allowed','points_scored')
    ),
    'teams', COALESCE((SELECT jsonb_agg(jsonb_build_object(
        'id',u.key,'name',u.display_name,'isOurs',u.is_ours,
        'rating',rt.rating,'gp',COALESCE(ts.gp,0),
        'wins',COALESCE(ts.wins,0),'losses',COALESCE(ts.losses,0),
        'pointsFor',COALESCE(ts.points_for,0),'pointsAgainst',COALESCE(ts.points_against,0),
        'realPointDiff',COALESCE(ts.real_point_diff,0),'cappedPointDiff',COALESCE(ts.capped_point_diff,0),
        'isForfeit',(f.team_key IS NOT NULL)
      )) FROM units u
      LEFT JOIN ratings rt ON rt.rkey = u.key
      LEFT JOIN team_stats ts ON ts.team = u.key
      LEFT JOIN forfeits f ON f.team_key = u.key), '[]'::jsonb),
    'games', COALESCE((SELECT jsonb_agg(jsonb_build_object('aId',a_key,'bId',b_key,'aScore',a_score,'bScore',b_score)) FROM all_games), '[]'::jsonb),
    'remaining', COALESCE((SELECT jsonb_agg(jsonb_build_object('aId',a_key,'bId',b_key)) FROM remaining_all), '[]'::jsonb)
  ) ELSE NULL END;
$function$;

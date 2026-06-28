-- ============================================================================
-- AAU STANDINGS CAP — HUB-ORG circuit_rules + restore operator's universal default 20
--   (APPLIED on Frank's apply-go for the #1130 substrate/qkey migrations; this corrects a
--    cap regression surfaced during post-apply verification of 20260628000000.)
--
-- WHAT WENT WRONG (grounded, prod vrwwpsbfbnveawqwbdmj 2026-06-28):
--   The substrate migration (20260628000000) replaced the operator's universal default-20
--   cap with a three-case per-circuit cap (matched-cap → that cap · matched-uncapped →
--   no cap · unmatched → 25), and backfilled tournament_divisions.circuit from the parent
--   tournament. Its header reasoned "tournaments.circuit matches circuit_rules.circuit_name
--   exactly" — TRUE for the circuit-NAME half of the join, but it missed the ORG half:
--     • ALL scraped TourneyMachine data lives under org a51e2a00-…-001 ("AAU Tournaments",
--       public-listed) — the hub org.
--     • EVERY circuit_rules row lives under the PILOT org e3e95e21-… .
--   The standings join is `cr.org_id = d.org_id AND cr.circuit_name = d.circuit`, so the
--   org half never matches for scraped divisions and the unmatched default governed every
--   hub division. Effect on the 317 hub divisions: 82 ZG + 3 League Play fell through the
--   cross-org gap; the 232 NULL-circuit divisions hit the unmatched 25. Before the substrate
--   migration ALL were at the operator's universal 20 (migration 20260627234848) — so this
--   was a live regression off the operator's explicit directive:
--     "Regardless of the score, the most points a team can win/lose by is 20 points in the
--      standings." (2026-06-27, vendor-confirmed for Zero Gravity.)
--
-- THE FIX (two parts):
--   (1) Give the hub org its own circuit_rules so the per-circuit logic actually binds on the
--       public/scraped data: AAU Zero Gravity → 20 (vendor-confirmed), League Play → NULL
--       (uncapped, per its own rules). Content mirrors the pilot org's rows (circuit rules are
--       circuit-wide facts, not org-specific). Idempotent via ON CONFLICT (org_id, circuit_name).
--       → fixes the 82 ZG (now 20) and 3 League Play (now uncapped) hub divisions.
--   (2) Restore the unmatched/unknown default from 25 → 20, matching the operator's UNIVERSAL
--       directive (and the pre-substrate behavior). Only genuinely-unclassified divisions hit
--       this path (the 232 hub divisions whose parent tournament has NULL/'AAU' circuit). The
--       architect's League-Play-uncapped carve-out is preserved via (1); the only deviation
--       from the staged three-case design is this fallback constant. DEVIATION FLAGGED for
--       architect: if the intended contract is "cap ONLY classified circuits, leave unknown at
--       a looser 25," revert this constant — but the operator's standing rule is 20 universal.
--
-- RE-TEST AFTER APPLY: get_public_tournament_standings('<a hub ZG division>') → rules.pointDiffCap
--   = 20 and a 20+ blowout margin caps at 20; a hub League Play division → pointDiffCap = null
--   (uncapped). The live Grand Finale Girls 5th/6th (bf16b329-…) → 20.
-- ============================================================================

-- (1) hub-org circuit_rules — make the per-circuit cap bind on the public/scraped data.
INSERT INTO public.circuit_rules (org_id, circuit_name, point_differential_cap, tiebreaker_rules, defensive_rules)
VALUES
  ('a51e2a00-aa17-4d12-9e00-000000000001', 'AAU Zero Gravity', 20,
   'Two teams tied? The team that won head-to-head advances. Three teams tied? Point differential decides it. Max PD from any single game is capped at +20.',
   'Man-to-man only in the first half. Man-to-man press allowed in the second half. No zone defense. No restrictions in the final 2 minutes.'),
  ('a51e2a00-aa17-4d12-9e00-000000000001', 'League Play', NULL,
   'League standings determined by win percentage. Head-to-head is the primary tiebreaker, followed by point differential against tied opponents.',
   'Zone defense permitted. Standard FIBA rules apply. Each team allowed 4 timeouts per game.')
ON CONFLICT (org_id, circuit_name) DO UPDATE
  SET point_differential_cap = EXCLUDED.point_differential_cap,
      tiebreaker_rules       = EXCLUDED.tiebreaker_rules,
      defensive_rules        = EXCLUDED.defensive_rules;

-- (2) restore the unmatched/unknown default 25 → 20 (operator's universal rule). Only the
--     three `25` literals in the cap CASE + rules.pointDiffCap ELSE change; everything else is
--     byte-identical to 20260628000000.
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
    -- three-case cap. matched & cap NOT NULL -> that cap (ZG 20) · matched & cap NULL ->
    --   uncapped (League Play) · unmatched -> 20 (operator's universal default).
    SELECT (cr.id IS NOT NULL) AS circuit_matched, cr.point_differential_cap AS circuit_cap
    FROM d
    LEFT JOIN public.circuit_rules cr ON cr.org_id = d.org_id AND cr.circuit_name = d.circuit
  ),
  units AS (
    SELECT tdt.id, tdt.external_team_key AS key, tdt.display_name, (tdt.team_id IS NOT NULL) AS is_ours
    FROM public.tournament_division_teams tdt JOIN d ON d.id = tdt.tournament_division_id
  ),
  fin AS (
    SELECT th.external_team_key AS hk, ta.external_team_key AS ak,
           dg.home_score AS hs, dg.away_score AS as_,
           (dg.home_score - dg.away_score) AS real_m,
           CASE
             WHEN (SELECT circuit_matched FROM cap) AND (SELECT circuit_cap FROM cap) IS NULL
               THEN (dg.home_score - dg.away_score)  -- matched & uncapped (League Play): no cap
             ELSE greatest(-COALESCE((SELECT circuit_cap FROM cap), 20),
                           least(COALESCE((SELECT circuit_cap FROM cap), 20),
                                 dg.home_score - dg.away_score))      -- ZG 20 / unknown 20
           END AS cap_m
    FROM public.division_games dg
    JOIN d ON d.id = dg.tournament_division_id
    JOIN public.tournament_division_teams th ON th.id = dg.home_division_team_id
    JOIN public.tournament_division_teams ta ON ta.id = dg.away_division_team_id
    WHERE dg.status = 'final' AND dg.home_score IS NOT NULL AND dg.away_score IS NOT NULL
      AND NOT dg.is_exhibition                                       -- (3) exclude exhibition
      AND th.external_team_key IS NOT NULL AND ta.external_team_key IS NOT NULL
  ),
  long AS (
    SELECT hk AS team, ak AS opp, hs AS my_s, as_ AS opp_s, real_m, cap_m FROM fin
    UNION ALL
    SELECT ak AS team, hk AS opp, as_ AS my_s, hs AS opp_s, -real_m, -cap_m FROM fin
  ),
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
      'pointDiffCap', CASE WHEN (SELECT circuit_matched FROM cap)
                            THEN (SELECT circuit_cap FROM cap)        -- ZG 20 · League Play null(uncapped)
                            ELSE 20 END,                              -- unknown default (operator universal 20)
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

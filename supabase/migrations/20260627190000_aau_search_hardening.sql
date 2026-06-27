-- AAU search hardening — follow-up to the #1128 re-grain (Copilot review #1128).
-- DEFENSIVE (0 current impact, grounded: 0 null keys, 0 non-public/archived live games) but
-- correct for robustness. Re-replaces search_public_aau ONLY; directory unchanged. Tier 1
-- (Plane A · additive/replace · reversible · no RLS/money/child). Owner applies on explicit go.
--
-- Two fixes vs 20260627180000:
--  (1) team_hits filters out NULL external_team_key — the column is nullable; a null would
--      emit teamKey=null into the public contract and break tracking/schedule lookups.
--  (2) live_keys gates the live scan through tournaments with org_is_public_listed + archived_at
--      IS NULL (matching fin and the rest of the RPC) — so a non-public or archived live game
--      can never mark a team live on the public surface.
-- NOT changed here (intentional, architect-grain): fin's full-finals scan (#3 perf) and the
-- recurring-key cross-event aggregation for the 69/3017 keys that reuse a TM id across 2
-- tournaments (#6 — those are the SAME team, 0 name-collisions; aggregating/tracking them
-- together is correct under Option A, the §2.E enrichment arriving early).
CREATE OR REPLACE FUNCTION public.search_public_aau(p_query text)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH term AS (SELECT lower(btrim(coalesce(p_query,''))) AS q),
  base AS (
    SELECT tt.id, tt.org_id, tt.name, tt.circuit, tt.start_date, tt.end_date,
      (SELECT count(*) FROM public.tournament_divisions d WHERE d.tournament_id = tt.id) AS div_count,
      (SELECT count(*) FROM public.tournament_division_teams x
         JOIN public.tournament_divisions d ON d.id = x.tournament_division_id
         WHERE d.tournament_id = tt.id) AS team_count
    FROM public.tournaments tt
    WHERE public.org_is_public_listed(tt.org_id) AND tt.archived_at IS NULL
  ),
  canon AS (
    SELECT id, org_id, name, circuit, start_date, end_date FROM (
      SELECT *, row_number() OVER (
        PARTITION BY lower(btrim(name)), start_date ORDER BY team_count DESC, div_count DESC, id
      ) AS rn FROM base WHERE div_count > 0
    ) r WHERE rn = 1
  ),
  team_hits AS (
    SELECT tdt.external_team_key AS team_key, tdt.display_name AS name, c.org_id,
           c.id AS tournament_id, c.name AS tournament_name, c.start_date,
           d.id AS division_id, d.name AS division_name, d.gender, d.grade_label, d.tier, d.day
    FROM canon c
    JOIN public.tournament_divisions d ON d.tournament_id = c.id
    JOIN public.tournament_division_teams tdt ON tdt.tournament_division_id = d.id
    WHERE (SELECT q FROM term) <> '' AND tdt.external_team_key IS NOT NULL
      AND lower(tdt.display_name) LIKE '%' || (SELECT q FROM term) || '%'
    ORDER BY c.start_date DESC, tdt.display_name
    LIMIT 50
  ),
  fin AS (
    SELECT th.external_team_key AS hk, ta.external_team_key AS ak,
           greatest(-25, least(25, dg.home_score - dg.away_score)) AS m
    FROM public.division_games dg
    JOIN public.tournament_divisions dd ON dd.id = dg.tournament_division_id
    JOIN public.tournaments tt ON tt.id = dd.tournament_id
    JOIN public.tournament_division_teams th ON th.id = dg.home_division_team_id
    JOIN public.tournament_division_teams ta ON ta.id = dg.away_division_team_id
    WHERE dg.status = 'final' AND dg.home_score IS NOT NULL AND dg.away_score IS NOT NULL
      AND public.org_is_public_listed(tt.org_id)
      AND th.external_team_key IS NOT NULL AND ta.external_team_key IS NOT NULL
  ),
  long AS (
    SELECT hk AS team, ak AS opp, m FROM fin
    UNION ALL SELECT ak AS team, hk AS opp, -m FROM fin
  ),
  raw AS (
    SELECT team, avg(m) AS rm, count(*) AS gp,
           count(*) FILTER (WHERE m > 0) AS w, count(*) FILTER (WHERE m < 0) AS l
    FROM long GROUP BY team
  ),
  rated AS (
    SELECT l.team AS rkey,
           round((r.rm + COALESCE(avg(ro.rm), 0))::numeric, 2) AS rating,
           r.gp, r.w, r.l
    FROM long l JOIN raw r ON r.team = l.team
    LEFT JOIN raw ro ON ro.team = l.opp
    WHERE l.team IN (SELECT team_key FROM team_hits)
    GROUP BY l.team, r.rm, r.gp, r.w, r.l
  ),
  live_keys AS (
    SELECT th.external_team_key AS rk
    FROM public.division_games dg
    JOIN public.tournament_divisions dd ON dd.id = dg.tournament_division_id
    JOIN public.tournaments tt ON tt.id = dd.tournament_id
    JOIN public.tournament_division_teams th ON th.id = dg.home_division_team_id
    WHERE dg.status='live' AND public.org_is_public_listed(tt.org_id) AND tt.archived_at IS NULL
      AND th.external_team_key IS NOT NULL
    UNION
    SELECT ta.external_team_key AS rk
    FROM public.division_games dg
    JOIN public.tournament_divisions dd ON dd.id = dg.tournament_division_id
    JOIN public.tournaments tt ON tt.id = dd.tournament_id
    JOIN public.tournament_division_teams ta ON ta.id = dg.away_division_team_id
    WHERE dg.status='live' AND public.org_is_public_listed(tt.org_id) AND tt.archived_at IS NULL
      AND ta.external_team_key IS NOT NULL
  ),
  teams_agg AS (
    SELECT jsonb_agg(jsonb_build_object(
      'teamKey', h.team_key, 'name', h.name,
      'programGroup', CASE
        WHEN position(' — ' in h.name) > 0 AND length(btrim(split_part(h.name,' — ',1))) >= 3 THEN btrim(split_part(h.name,' — ',1))
        WHEN position(' - ' in h.name) > 0 AND length(btrim(split_part(h.name,' - ',1))) >= 3 THEN btrim(split_part(h.name,' - ',1))
        ELSE NULL END,
      'tournamentId', h.tournament_id, 'tournamentName', h.tournament_name,
      'divisionId', h.division_id, 'divisionName', h.division_name,
      'gender', h.gender, 'gradeLabel', h.grade_label, 'tier', h.tier, 'day', h.day,
      'record', jsonb_build_object('w', COALESCE(rt.w,0), 'l', COALESCE(rt.l,0)),
      'rating', rt.rating, 'basis', (COALESCE(rt.gp,0) > 0),
      'isLive', (lk.rk IS NOT NULL)
    ) ORDER BY h.start_date DESC, h.name) AS j
    FROM team_hits h
    LEFT JOIN rated rt ON rt.rkey = h.team_key
    LEFT JOIN live_keys lk ON lk.rk = h.team_key
  ),
  tour_agg AS (
    SELECT jsonb_agg(jsonb_build_object(
      'tournamentId', c.id, 'name', c.name, 'circuit', c.circuit,
      'startDate', c.start_date, 'endDate', c.end_date,
      'divisionCount', (SELECT count(*) FROM public.tournament_divisions d WHERE d.tournament_id = c.id),
      'isLive', EXISTS (SELECT 1 FROM public.division_games dg JOIN public.tournament_divisions d ON d.id=dg.tournament_division_id WHERE d.tournament_id=c.id AND dg.status='live')
    ) ORDER BY c.start_date DESC) AS j
    FROM canon c
    WHERE (SELECT q FROM term) <> '' AND lower(c.name) LIKE '%' || (SELECT q FROM term) || '%'
  ),
  div_agg AS (
    SELECT jsonb_agg(jsonb_build_object(
      'divisionId', d.id,
      'label', NULLIF(btrim(concat_ws(' · ', d.gender, d.grade_label, d.tier)), ''),
      'tournamentName', c.name,
      'teamCount', (SELECT count(*) FROM public.tournament_division_teams x WHERE x.tournament_division_id = d.id)
    ) ORDER BY c.start_date DESC) AS j
    FROM canon c JOIN public.tournament_divisions d ON d.tournament_id = c.id
    WHERE (SELECT q FROM term) <> '' AND (
      lower(d.name) LIKE '%' || (SELECT q FROM term) || '%' OR
      lower(concat_ws(' ', d.gender, d.grade_label, d.tier)) LIKE '%' || (SELECT q FROM term) || '%'
    )
    LIMIT 20
  )
  SELECT jsonb_build_object(
    'teams', COALESCE((SELECT j FROM teams_agg), '[]'::jsonb),
    'tournaments', COALESCE((SELECT j FROM tour_agg), '[]'::jsonb),
    'divisions', COALESCE((SELECT j FROM div_agg), '[]'::jsonb)
  );
$function$;

GRANT EXECUTE ON FUNCTION public.search_public_aau(text) TO anon, authenticated;

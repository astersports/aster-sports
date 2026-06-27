-- AAU team-key re-grain + directory venue_state (architect-ruled L99 backbone, Option A).
-- Owner-applies; mirror of the migration applied via MCP (AP #21). ADDITIVE/REPLACE of the
-- TWO functions only (search_public_aau, get_public_tournament_directory). No DDL beyond
-- CREATE OR REPLACE + re-GRANT + COMMENT. search_public_teams (v1 fallback) is NOT touched.
-- get_public_aau_team_schedule already accepts external_team_key (verified) — unchanged here.
--
-- WHY (architect Option A): search_public_aau keyed teamKey AND the record/rating join on
-- resolved_key = lower(display_name), which COLLIDES — e.g. "legacy hoopers" = 14 distinct
-- division-teams across 5 tournaments collapse into ONE identity → ONE shared rating (wrong)
-- + ONE shared tracked-state (tracking one flips all 14). Grounded fix: re-grain onto
-- tournament_division_teams.external_team_key (TM IDTeam) — proven precise: every external_team_key
-- maps to a single real team (display_name), the only multi-row cases are the SAME team recurring
-- across DIFFERENT tournaments (0 within-tournament collisions; 0 cross-team name collisions).
-- external_team_key is per-(tournament,division) registration, so the rating becomes PER-TOURNAMENT
-- (per-event opponent-adjusted) — the architect-ruled correct model (teams are only ever compared
-- within their own tournament's opponent graph). Record = per-context exact. Both keyed on
-- external_team_key. Tracking now co-toggles only the one division-team the user picked.
--
-- The rating formula is IDENTICAL in shape to get_public_tournament_standings (capped ±25 margin
-- + avg opponent margin: round((rm + COALESCE(avg(opp.rm),0))::numeric, 2)); ONLY the aggregation
-- KEY changes (resolved_key → external_team_key).

-- =====================================================================================
-- Change 1 — re-grain search_public_aau(p_query text) onto external_team_key.
-- Everything else (typed {teams,tournaments,divisions} shape, programGroup hint, tournaments
-- + divisions sections, ordering, LIMITs) is IDENTICAL to 20260627160550.
-- =====================================================================================
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
    WHERE (SELECT q FROM term) <> '' AND lower(tdt.display_name) LIKE '%' || (SELECT q FROM term) || '%'
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
    SELECT th.external_team_key AS rk FROM public.division_games dg
      JOIN public.tournament_division_teams th ON th.id = dg.home_division_team_id WHERE dg.status='live'
    UNION
    SELECT ta.external_team_key AS rk FROM public.division_games dg
      JOIN public.tournament_division_teams ta ON ta.id = dg.away_division_team_id WHERE dg.status='live'
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

-- =====================================================================================
-- Change 2 — A6: add nullable `states` (DISTINCT venues.state set) to each tournament object
-- in get_public_tournament_directory(). Derived ONLY from venues.state (geocoded) reached via
-- division_games.venue_id → venues; never guessed. No geocoded venue → states: [] (null-honest,
-- filterable as unknown). Multi-state tournament → the DISTINCT SET (don't pick one). Everything
-- else in the directory function is IDENTICAL to its prior body.
-- =====================================================================================
CREATE OR REPLACE FUNCTION public.get_public_tournament_directory()
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH base AS (
    SELECT tt.id, tt.org_id, tt.name, tt.circuit, tt.start_date, tt.end_date,
      (SELECT count(*) FROM public.tournament_divisions d WHERE d.tournament_id = tt.id) AS div_count,
      (SELECT count(*) FROM public.tournament_division_teams x
        JOIN public.tournament_divisions d ON d.id = x.tournament_division_id
        WHERE d.tournament_id = tt.id) AS team_count
    FROM public.tournaments tt
    WHERE public.org_is_public_listed(tt.org_id) AND tt.archived_at IS NULL
  ),
  ranked AS (
    SELECT *, row_number() OVER (
      PARTITION BY lower(btrim(name)), start_date
      ORDER BY team_count DESC, div_count DESC, id
    ) AS rn
    FROM base
    WHERE div_count > 0                       -- drop empty (0-division) tournaments
  ),
  t AS (SELECT * FROM ranked WHERE rn = 1),   -- one per (name, date): the richest copy
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
    'states', COALESCE((
      SELECT jsonb_agg(DISTINCT v.state ORDER BY v.state)
      FROM public.division_games dg
      JOIN public.tournament_divisions d ON d.id = dg.tournament_division_id
      JOIN public.venues v ON v.id = dg.venue_id
      WHERE d.tournament_id = t.id AND v.state IS NOT NULL AND btrim(v.state) <> ''
    ), '[]'::jsonb),
    'divisions', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', d.id, 'name', d.name, 'grade_label', d.grade_label, 'gender', d.gender,
        'advance_count', d.advance_count, 'team_count', d.team_count) ORDER BY d.sort_order, d.name)
      FROM divs d WHERE d.tournament_id = t.id), '[]'::jsonb)
  ) ORDER BY t.start_date DESC), '[]'::jsonb)
  FROM t;
$function$;

-- Public-read RPCs: callable by the anon hub + signed-in users (Plane A). Re-GRANT (idempotent).
GRANT EXECUTE ON FUNCTION public.search_public_aau(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_tournament_directory() TO anon, authenticated;

COMMENT ON FUNCTION public.search_public_aau(text) IS
  'AAU Discovery search v2 (public-read, Plane A). Typed {teams,tournaments,divisions}; teams are FLAT variant rows. RE-GRAINED 2026-06-27 (architect Option A): teamKey + record/rating/basis/isLive/tracking now key on tournament_division_teams.external_team_key (TM IDTeam) instead of resolved_key. external_team_key is per-(tournament,division) registration, so record = per-context exact and rating = PER-TOURNAMENT (per-event opponent-adjusted, the form a team showed IN THAT EVENT). Fixes the resolved_key collision (one slug = many division-teams sharing one rating + co-toggling tracking). Rating formula UNCHANGED in shape from get_public_tournament_standings (capped ±25 margin + avg opponent margin); only the aggregation key changed. programGroup stays a non-authoritative presentation hint. Additive; search_public_teams retained as v1 fallback.';
COMMENT ON FUNCTION public.get_public_tournament_directory() IS
  'AAU Discovery directory (public-read, Plane A). Canonical-deduped tournaments + divisions. ADDED 2026-06-27 (A6): nullable `states` = DISTINCT set of venues.state reached via division_games.venue_id (geocoded only; no geocoded venue => [], null-honest/filterable; multi-state carries the full set). Additive.';

-- AAU Discovery redesign — public-read contract additions (architect-approved L99,
-- 2026-06-27: A1 typed/grouped/valued search + A2 value-in-row + A3 tier/day + A5 live-now).
-- ADDITIVE ONLY: search_public_teams is RETAINED as the v1 fallback (never renamed/removed).
-- Plane A (public) reads only, gated by org_is_public_listed. No PII/child/money fields.
-- Mirror of the migration applied via MCP (owner-applied per L99, same as §2.B). AP #21.

-- Perf (architect condition): trigram index so the '%q%' search predicate is index-usable
-- at type-speed, + a partial index on the live predicate (hit on every Find load).
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_tdt_display_name_trgm
  ON public.tournament_division_teams USING gin (lower(display_name) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_tournaments_name_trgm
  ON public.tournaments USING gin (lower(name) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_division_games_live
  ON public.division_games (tournament_division_id) WHERE status = 'live';

-- A1+A2+A3 — search_public_aau: typed { teams, tournaments, divisions }.
-- teams = FLAT variant rows (architect shape condition: NO nested program object in the
-- contract). Each row carries the authoritative resolved_key (teamKey) PLUS a NON-
-- AUTHORITATIVE programGroup hint; the client renders the visual nesting from the hint, and
-- when the true `programs` entity lands it simply populates the same hint (zero-debt supersede).
-- record/rating/basis use the SAME formula + source as get_public_tournament_standings
-- (global resolved_key margin graph) so the number can never diverge across surfaces
-- (CLAUDE.md AP #63 PATTERN A). rating is NULL unless basis (gp>0); no fabricated value (§7).
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
    SELECT tdt.resolved_key AS team_key, tdt.display_name AS name, c.org_id,
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
    SELECT th.resolved_key AS rk FROM public.division_games dg
      JOIN public.tournament_division_teams th ON th.id = dg.home_division_team_id WHERE dg.status='live'
    UNION
    SELECT ta.resolved_key AS rk FROM public.division_games dg
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

-- A5 — get_public_live_now: currently-live public games for the front-door strip + live dots.
-- One cheap projection read (architect condition); the realtime TICK is TECH-1 (deferred).
CREATE OR REPLACE FUNCTION public.get_public_live_now(p_limit integer DEFAULT 12)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT COALESCE(jsonb_agg(x.obj), '[]'::jsonb) FROM (
    SELECT jsonb_build_object(
      'gameId', dg.id,
      'startAt', dg.start_at,
      'homeName', h.display_name,
      'awayName', a.display_name,
      'homeScore', dg.home_score,
      'awayScore', dg.away_score,
      'divisionLabel', NULLIF(btrim(concat_ws(' · ', d.gender, d.grade_label, d.tier)), ''),
      'tournamentName', tt.name
    ) AS obj
    FROM public.division_games dg
    JOIN public.tournament_divisions d ON d.id = dg.tournament_division_id
    JOIN public.tournaments tt ON tt.id = d.tournament_id
    JOIN public.tournament_division_teams h ON h.id = dg.home_division_team_id
    JOIN public.tournament_division_teams a ON a.id = dg.away_division_team_id
    WHERE dg.status = 'live' AND public.org_is_public_listed(tt.org_id) AND tt.archived_at IS NULL
    ORDER BY dg.start_at DESC NULLS LAST
    LIMIT GREATEST(1, LEAST(50, COALESCE(p_limit, 12)))
  ) x;
$function$;

-- Public-read RPCs: callable by the anon hub + signed-in users (Plane A).
GRANT EXECUTE ON FUNCTION public.search_public_aau(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_live_now(integer) TO anon, authenticated;

COMMENT ON FUNCTION public.search_public_aau(text) IS
  'AAU Discovery search v2 (public-read, Plane A). Typed {teams,tournaments,divisions}; teams are FLAT variant rows carrying authoritative resolved_key (teamKey) + non-authoritative programGroup hint (presentation-only; conservative split on " - "/" — ", never writes identity). record/rating/basis = same formula+source as get_public_tournament_standings (no PATTERN A divergence). Additive; search_public_teams retained as v1.';
COMMENT ON FUNCTION public.get_public_live_now(integer) IS
  'AAU Discovery live-now strip (public-read, Plane A). Currently-live public games; realtime tick is TECH-1 (deferred). Additive.';
COMMENT ON FUNCTION public.search_public_teams(text) IS
  'DEPRECATED-NOT-REMOVED (2026-06-27): v1 flat teams-only search, retained as the fallback for search_public_aau (v2). Do not extend; new fields land on search_public_aau.';

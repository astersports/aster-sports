-- ============================================================================
-- AAU TEAM-IDENTITY RE-GRAIN — INTERIM "QUALIFIED KEY" (ruling C)  (STAGED — owner-applied)
-- Architect team-identity fork ruling 2026-06-27: C now, B later. Canonical version assigned at apply.
--
-- WHY: D1 proved the team page's "season" is a resolved_key COLLISION — different same-named teams in
--   different grade/gender divisions merge into one identity (High Rise - Brie showed 35 games hiding
--   16 real; >50% of the live team page was someone else's data). Bare lower(resolved_key) = 1799
--   distinct identities; same-named teams across grade/gender collapse.
--
-- THE QUALIFIED KEY (interim, read-side): qkey = lower(resolved_key) : gender : grade.
--   It STRICTLY REFINES resolved_key (1799 → 2387 identities, +588, never combining two). Validated
--   exhaustively (adversarial workflow 2026-06-28): ZERO within-division false-merges, ZERO
--   cross-tournament two-program collapses, ZERO cross-org collisions; every deviation is a SAFE
--   over-split (a program's multiple age/gender teams). program·grade·gender is STABLE across
--   tournaments for one real team, so the qkey still groups one team's season across events while
--   splitting different same-named teams. Acceptance bar (architect) — all three met:
--     1. High Rise - Brie resolves to its real season (F:6th, 5 tournaments) — the 35→collision games
--        from the genuinely-different F:5th/6th + CT teams are split off. ("16" was one tournament.)
--     2. Twins resolve: "Legacy Hoopers" vs "Legacy Hoopers 2" (both M 2nd) split — resolved_key
--        already retains the "2"/"(NY)"/"3AB" variant, so no extra variant signal is needed.
--     3. Err toward split, never merge: confirmed zero merges; residual is harmless over-split.
--
-- C IS INTERIM. B (canonical team entity, stable id, scraper-side) is the lasting substrate — also
--   what the by-kid layer, film attribution, and 5th→6th cross-SEASON aging need. C's qualifier feeds
--   B's resolution; B supersedes C cleanly (key on the canonical id, retire the qualifier).
--
-- SURFACE (mapped exhaustively, adversarial workflow): four key-bearing RPCs move to qkey TOGETHER
--   (producer/matcher grain already diverges in prod — search emits external_team_key while the
--   schedule self-heal arm matches resolved_key; they must align). get_public_tournament_standings is
--   intra-division (external_team_key, correct) and is UNCHANGED.
--
-- BACKWARD-COMPATIBLE CUTOVER (no read goes dark): the schedule RPC stays DUAL-READ — it adds a qkey
--   match arm while KEEPING the legacy resolved_key / external_team_key / id arms, so already-tracked
--   teams still resolve during the transition. The producers emit qkey so NEW tracks are clean; the
--   account backfill (below) + the frontend localStorage v2 migration upgrade existing tracks. The
--   bare-resolved_key arm is removed in a later migration once no stored bare-slug keys remain.
--
-- PAIRED FRONTEND (CC PR, ships after this applies): teamGames.ts gamesForTeam matches on the per-game
--   `qkey` this migration now echoes; trackingStore gains a v2 localStorage migration that upgrades
--   stored teamKey old→qkey using the stored divisionName. Both degrade gracefully (display-name +
--   trackedTeamId fallbacks) so nothing breaks before apply.
--
-- RE-TEST AT APPLY: SELECT get_public_aau_team_schedule(ARRAY['high rise - brie:f:6th']) returns the
--   real 5-tournament season (not 35 merged); search_public_aau('high rise') emits qkey teamKeys with
--   one season record per identity.
-- ============================================================================

-- ── the read-side qualified key (immutable, pure) ──────────────────────────
CREATE OR REPLACE FUNCTION public.aau_qkey(p_resolved text, p_gender text, p_grade_label text,
                                           p_grade_min int DEFAULT NULL, p_grade_max int DEFAULT NULL)
RETURNS text LANGUAGE sql IMMUTABLE PARALLEL SAFE AS $$
  SELECT lower(coalesce(p_resolved,'')) || ':' || coalesce(p_gender,'') || ':'
      || coalesce(p_grade_label, p_grade_min::text || '-' || p_grade_max::text, '');
$$;

-- ── 1) team-page schedule: ADD qkey match arm + ECHO per-game qkey (keep legacy arms) ──
CREATE OR REPLACE FUNCTION public.get_public_aau_team_schedule(p_team_ids text[])
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $function$
  select coalesce(jsonb_agg(g.row order by g.sort_at nulls last), '[]'::jsonb)
  from (
    select dg.start_at as sort_at,
      jsonb_build_object(
        'gameId', dg.id, 'gameCode', dg.external_game_id,
        'trackedTeamId', tt.id, 'trackedTeamName', tt.display_name,
        'qkey', public.aau_qkey(tt.resolved_key, d.gender, d.grade_label, d.grade_min, d.grade_max),
        'isHome', dg.home_division_team_id = tt.id,
        'opponent', case when dg.home_division_team_id = tt.id then opp_a.display_name else opp_h.display_name end,
        'myScore', case when dg.home_division_team_id = tt.id then dg.home_score else dg.away_score end,
        'oppScore', case when dg.home_division_team_id = tt.id then dg.away_score else dg.home_score end,
        'status', dg.status, 'startAt', dg.start_at, 'court', dg.court,
        'division', d.name, 'tournamentId', t.id, 'tournament', t.name,
        'venue', case when v.id is not null then jsonb_build_object('name',v.name,'address',v.address,'city',v.city,'state',v.state,'lat',v.lat,'lng',v.lng) else null end
      ) as row
    from tournament_division_teams tt
    join tournament_divisions d on d.id = tt.tournament_division_id
    join tournaments t on t.id = d.tournament_id
    join division_games dg on (dg.home_division_team_id = tt.id or dg.away_division_team_id = tt.id)
    left join tournament_division_teams opp_h on opp_h.id = dg.home_division_team_id
    left join tournament_division_teams opp_a on opp_a.id = dg.away_division_team_id
    left join venues v on v.id = dg.venue_id
    where (
        public.aau_qkey(tt.resolved_key, d.gender, d.grade_label, d.grade_min, d.grade_max) = any (p_team_ids)  -- C: qualified key
        or lower(tt.resolved_key) = any (array(select lower(k) from unnest(p_team_ids) as k))                   -- legacy (transition; remove later)
        or tt.external_team_key = any (p_team_ids)                                                              -- legacy (finer, non-colliding)
        or tt.id::text = any (p_team_ids)                                                                       -- legacy (per-row id)
      )
      and t.archived_at is null
      and public.org_is_public_listed(t.org_id)
  ) g;
$function$;

-- ── 2) AAU search: PRODUCE teamKey = qkey AND aggregate rating/record by qkey (one season per team) ──
CREATE OR REPLACE FUNCTION public.search_public_aau(p_query text)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $function$
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
    SELECT public.aau_qkey(tdt.resolved_key, d.gender, d.grade_label, d.grade_min, d.grade_max) AS team_key,
           tdt.display_name AS name, c.org_id,
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
    SELECT public.aau_qkey(th.resolved_key, dd.gender, dd.grade_label, dd.grade_min, dd.grade_max) AS hk,
           public.aau_qkey(ta.resolved_key, dd.gender, dd.grade_label, dd.grade_min, dd.grade_max) AS ak,
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
    SELECT public.aau_qkey(th.resolved_key, dlh.gender, dlh.grade_label, dlh.grade_min, dlh.grade_max) AS rk
    FROM public.division_games dg
      JOIN public.tournament_division_teams th ON th.id = dg.home_division_team_id
      JOIN public.tournament_divisions dlh ON dlh.id = th.tournament_division_id
    WHERE dg.status='live'
    UNION
    SELECT public.aau_qkey(ta.resolved_key, dla.gender, dla.grade_label, dla.grade_min, dla.grade_max) AS rk
    FROM public.division_games dg
      JOIN public.tournament_division_teams ta ON ta.id = dg.away_division_team_id
      JOIN public.tournament_divisions dla ON dla.id = ta.tournament_division_id
    WHERE dg.status='live'
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

-- ── 3) v1 global team search: PRODUCE teamKey = qkey (was tdt.id) ──
CREATE OR REPLACE FUNCTION public.search_public_teams(p_query text)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $function$
  WITH term AS (SELECT lower(btrim(coalesce(p_query, ''))) AS q),
  base AS (
    SELECT tt.id, tt.name, tt.start_date, tt.end_date,
      (SELECT count(*) FROM public.tournament_divisions d WHERE d.tournament_id = tt.id) AS div_count,
      (SELECT count(*) FROM public.tournament_division_teams x
         JOIN public.tournament_divisions d ON d.id = x.tournament_division_id
         WHERE d.tournament_id = tt.id) AS team_count
    FROM public.tournaments tt
    WHERE public.org_is_public_listed(tt.org_id) AND tt.archived_at IS NULL
  ),
  canon AS (
    SELECT id, name, start_date, end_date FROM (
      SELECT *, row_number() OVER (
        PARTITION BY lower(btrim(name)), start_date ORDER BY team_count DESC, div_count DESC, id
      ) AS rn
      FROM base WHERE div_count > 0
    ) r WHERE rn = 1
  ),
  hits AS (
    SELECT public.aau_qkey(tdt.resolved_key, d.gender, d.grade_label, d.grade_min, d.grade_max) AS team_key,
           tdt.display_name AS name,
           c.id AS tournament_id, c.name AS tournament_name, c.start_date, c.end_date,
           d.id AS division_id, d.name AS division_name, d.grade_label, d.gender
    FROM canon c
    JOIN public.tournament_divisions d ON d.tournament_id = c.id
    JOIN public.tournament_division_teams tdt ON tdt.tournament_division_id = d.id
    WHERE (SELECT q FROM term) <> ''
      AND lower(tdt.display_name) LIKE '%' || (SELECT q FROM term) || '%'
    ORDER BY c.start_date DESC, tdt.display_name
    LIMIT 50
  )
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'teamKey', team_key, 'name', name,
    'tournamentId', tournament_id, 'tournamentName', tournament_name,
    'startDate', start_date, 'endDate', end_date,
    'divisionId', division_id, 'divisionName', division_name,
    'gradeLabel', grade_label, 'gender', gender
  )), '[]'::jsonb) FROM hits;
$function$;

-- ── 4) own-org season echo: ECHO teamKey = qkey (was bare resolved_key) ──
CREATE OR REPLACE FUNCTION public.get_public_team_season(p_org_id uuid, p_team_name text, p_division_like text)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $function$
  WITH mine AS (
    SELECT dt.id AS team_id, dt.resolved_key, dt.display_name,
           d.id AS division_id, d.name AS division_name, d.circuit,
           d.gender, d.grade_label, d.grade_min, d.grade_max,
           t.name AS tournament_name, t.start_date, t.end_date,
           cr.point_differential_cap AS cap,
           (SELECT count(*) FROM public.tournament_division_teams x WHERE x.tournament_division_id = d.id) AS team_count
    FROM public.tournament_division_teams dt
    JOIN public.tournament_divisions d ON d.id = dt.tournament_division_id
    JOIN public.tournaments t ON t.id = d.tournament_id
    LEFT JOIN public.circuit_rules cr ON cr.org_id = t.org_id AND cr.circuit_name = d.circuit
    WHERE t.org_id = p_org_id AND public.org_is_public_listed(t.org_id) AND t.archived_at IS NULL
      AND dt.display_name ILIKE p_team_name
      AND (p_division_like IS NULL OR d.name ILIKE p_division_like)
  ),
  agg AS (
    SELECT m.division_id, m.team_id,
      sum(CASE WHEN (g.home_division_team_id = m.team_id AND g.home_score > g.away_score)
                 OR (g.away_division_team_id = m.team_id AND g.away_score > g.home_score) THEN 1 ELSE 0 END) AS wins,
      sum(CASE WHEN (g.home_division_team_id = m.team_id AND g.home_score < g.away_score)
                 OR (g.away_division_team_id = m.team_id AND g.away_score < g.home_score) THEN 1 ELSE 0 END) AS losses,
      sum(CASE WHEN g.home_division_team_id = m.team_id
               THEN greatest(-coalesce(m.cap, 1000000), least(coalesce(m.cap, 1000000), g.home_score - g.away_score))
               ELSE greatest(-coalesce(m.cap, 1000000), least(coalesce(m.cap, 1000000), g.away_score - g.home_score)) END) AS diff,
      count(*) AS gp
    FROM mine m
    JOIN public.division_games g ON g.tournament_division_id = m.division_id
      AND g.status = 'final' AND g.home_score IS NOT NULL AND g.away_score IS NOT NULL
      AND (g.home_division_team_id = m.team_id OR g.away_division_team_id = m.team_id)
    GROUP BY m.division_id, m.team_id
  )
  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'tournament', m.tournament_name, 'startDate', m.start_date, 'endDate', m.end_date,
    'division', m.division_name, 'divisionId', m.division_id, 'circuit', m.circuit,
    'teamKey', public.aau_qkey(m.resolved_key, m.gender, m.grade_label, m.grade_min, m.grade_max), 'teamCount', m.team_count,
    'wins', coalesce(a.wins, 0), 'losses', coalesce(a.losses, 0),
    'diff', coalesce(a.diff, 0), 'gamesPlayed', coalesce(a.gp, 0)
  ) ORDER BY m.start_date), '[]'::jsonb)
  FROM mine m LEFT JOIN agg a ON a.division_id = m.division_id AND a.team_id = m.team_id;
$function$;

-- ── account-track backfill: rewrite tracked_teams.team_key old → qkey, using the stored division_id ──
-- (anon/localStorage tracks are upgraded by the paired frontend v2 migration.) Dedupe rows that now
-- collapse to one qkey (a parent who tracked the "same" team in two tournaments under the bare slug)
-- before the UPDATE so the (user_id, team_key) unique index is never violated.
DO $$
BEGIN
  -- map every tracked row to its target qkey via the stored division_id (precise — never name-only)
  CREATE TEMP TABLE _tt_remap ON COMMIT DROP AS
    SELECT tr.id AS tracked_id, tr.user_id,
           public.aau_qkey(tt.resolved_key, d.gender, d.grade_label, d.grade_min, d.grade_max) AS qkey
    FROM public.tracked_teams tr
    JOIN public.tournament_divisions d ON d.id::text = tr.division_id
    JOIN public.tournament_division_teams tt ON tt.tournament_division_id = d.id
     AND (lower(tt.resolved_key) = lower(tr.team_key) OR tt.external_team_key = tr.team_key OR tt.id::text = tr.team_key)
    WHERE tr.division_id IS NOT NULL;

  -- collapse duplicates: keep the lowest tracked_id per (user_id, qkey)
  DELETE FROM public.tracked_teams t
  USING _tt_remap r
  WHERE t.id = r.tracked_id
    AND EXISTS (SELECT 1 FROM _tt_remap r2 WHERE r2.user_id = r.user_id AND r2.qkey = r.qkey AND r2.tracked_id < r.tracked_id);

  UPDATE public.tracked_teams t
  SET team_key = r.qkey
  FROM _tt_remap r
  WHERE t.id = r.tracked_id AND t.team_key <> r.qkey;
END $$;

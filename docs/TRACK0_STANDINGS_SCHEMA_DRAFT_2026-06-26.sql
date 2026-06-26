-- ============================================================================
-- TRACK 0 — AAU FAMILY HUB : DIVISION / POOL / BRACKET STANDINGS SUBSTRATE
-- D-FV3 (option B, junction tables) — DRAFT FOR ARCHITECT DESIGN REVIEW
-- ============================================================================
-- STATUS: *** NOT APPLIED. DO NOT APPLY. *** This is a design-review artifact.
--   The owner applies after the architect reviews. At apply time it moves to
--   supabase/migrations/<production_version>_aau_standings_substrate.sql with the
--   production version-string prefix assigned by the apply (AP #21 — CC never
--   guesses the version prefix for MCP-applied schema). It lives in docs/ until
--   then so CI/tools never treat it as a live migration.
--
-- SCOPE (deliberately narrow, per the architect ruling §E):
--   * NON-money, NON-child-data. Touches ONLY the tournament's factual structure
--     (divisions, pools, brackets, game→division links).
--   * Nothing here references guardians, payment, film, child identity, or
--     entitlement. Those tables are HELD for the §B verified-guardian contract
--     and §D entitlement contract and are NOT in this migration.
--   * Data classification (D-FV8, ratified): everything here is PUBLIC-eligible
--     "tournament factual state." Public anon exposure is via a SECDEF RPC that
--     ships with the standings engine (D-FV4) — matching the existing
--     get_public_team_schedule pattern — NOT via open anon table policies. This
--     migration gives STAFF (authenticated, org-scoped) RLS only.
--
-- GROUNDED AGAINST main @ #1101:
--   * tournaments(id, org_id, circuit, pool_label, schedule_status…) 011_tournaments.sql
--   * tournament_teams(tournament_id, team_id, final_record_wins/losses, final_place)
--   * circuit_rules(org_id, circuit_name, tiebreaker_rules, point_differential_cap)
--       — Zero Gravity (cap=20) + League Play already seeded for Legacy.
--   * game_results(event_id, our_score, opponent_score, result, published_at)
--   * events(id, team_id, tournament_id, opponent, publish_status, location_id…)
--   * divisions(...) EXISTS but is PROGRAM-scoped (internal seasons) — NOT reused
--     here; tournament divisions are a different concept (a bracket/pool grouping
--     inside one tournament, often mostly opponents we don't run).
--   * championship_scenarios EXISTS (hand-authored narrative rows) — the D-FV5
--     predictor supersedes/feeds it; see OPEN QUESTION 4.
--   * Helpers reused: current_user_org_id(), user_has_role_in_org(org, roles[]).
--
-- WHY junction tables (recap of the ratified call): standings must be scoped to
--   (tournament, division[, pool]); a jsonb blob isn't queryable and repeats the
--   dead-config trap (§16.16). These tables make standings + the predictor a join.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. tournament_divisions — a division WITHIN one tournament
--    e.g. "5th Grade Girls", "Boys 8U". Carries the advancement rule
--    (how many teams reach the bracket) + which circuit's tiebreakers apply.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tournament_divisions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,  -- denormalized for RLS + the public gate
  tournament_id   uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  name            text NOT NULL,                       -- "5th Grade Girls", "Boys 8U Blue"
  grade_label     text,                                -- display: "5th Grade" / "8U"
  grade_min       integer,
  grade_max       integer,
  gender          text CHECK (gender IN ('M','F','Coed')),
  circuit         text,                                -- joins circuit_rules(org_id, circuit_name); defaults from tournaments.circuit
  advance_count   integer NOT NULL DEFAULT 2,          -- top-N advance to bracket (Frank: "1st & 2nd go to the bracket")
  bracket_size    integer,                             -- nullable; 4/8/… once known
  sort_order      integer NOT NULL DEFAULT 0,
  external_division_key text,                          -- scraper idempotency (TourneyMachine division id)
  created_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT tournament_divisions_unique UNIQUE (tournament_id, name)
);
CREATE INDEX IF NOT EXISTS idx_tournament_divisions_tournament
  ON public.tournament_divisions (tournament_id, sort_order);
CREATE UNIQUE INDEX IF NOT EXISTS idx_tournament_divisions_extkey
  ON public.tournament_divisions (tournament_id, external_division_key)
  WHERE external_division_key IS NOT NULL;

-- ----------------------------------------------------------------------------
-- 2. tournament_division_teams — the STANDINGS UNIT.
--    One row per team competing in a division. CRITICAL: most teams in a
--    division are NOT ours — they're opponents. So a standings unit is EITHER
--    one of our teams (team_id), OR a known opponent (opponent_id), OR an
--    external team known only by scraped name. display_name is always present.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tournament_division_teams (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                  uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  tournament_division_id  uuid NOT NULL REFERENCES public.tournament_divisions(id) ON DELETE CASCADE,
  team_id                 uuid REFERENCES public.teams(id) ON DELETE CASCADE,      -- set iff this is OUR team
  opponent_id             uuid REFERENCES public.opponents(id) ON DELETE CASCADE,  -- set iff a known external team
  display_name            text NOT NULL,                                           -- always present (scraped/canonical name)
  external_team_key       text,                                                    -- scraper idempotency (TM team id)
  seed                    integer,                                                 -- pool seed once standings settle
  sort_order              integer NOT NULL DEFAULT 0,
  created_at              timestamptz NOT NULL DEFAULT now(),
  -- Architect OQ2 guard: identity = id-if-present, else normalized name. Generated
  -- so a name-only row and an opponent_id row can't split one team's standings, and
  -- so PROMOTION (later setting team_id/opponent_id on a name-only row) regenerates
  -- the key while the row's PK is unchanged — its games (FK to this id) are preserved.
  resolved_key            text GENERATED ALWAYS AS (
                            COALESCE(team_id::text, opponent_id::text, lower(btrim(display_name)))
                          ) STORED,
  -- at most ONE local identity; both NULL = external-by-name only:
  CONSTRAINT tdt_one_identity CHECK (num_nonnulls(team_id, opponent_id) <= 1),
  CONSTRAINT tournament_division_teams_resolved_unique UNIQUE (tournament_division_id, resolved_key)
);
CREATE INDEX IF NOT EXISTS idx_tdt_division
  ON public.tournament_division_teams (tournament_division_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_tdt_team
  ON public.tournament_division_teams (team_id) WHERE team_id IS NOT NULL;

-- ----------------------------------------------------------------------------
-- 3. tournament_pools — a pool within a division ("Pool A", "Pool B").
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tournament_pools (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                  uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  tournament_division_id  uuid NOT NULL REFERENCES public.tournament_divisions(id) ON DELETE CASCADE,
  name                    text NOT NULL,               -- "Pool A"
  sort_order              integer NOT NULL DEFAULT 0,
  created_at              timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT tournament_pools_unique UNIQUE (tournament_division_id, name)
);
CREATE INDEX IF NOT EXISTS idx_tournament_pools_division
  ON public.tournament_pools (tournament_division_id, sort_order);

-- ----------------------------------------------------------------------------
-- 4. pool_teams — membership of a standings unit in a pool (round-robin set).
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.pool_teams (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                      uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  tournament_pool_id          uuid NOT NULL REFERENCES public.tournament_pools(id) ON DELETE CASCADE,
  tournament_division_team_id uuid NOT NULL REFERENCES public.tournament_division_teams(id) ON DELETE CASCADE,
  seed                        integer,
  created_at                  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pool_teams_unique UNIQUE (tournament_pool_id, tournament_division_team_id)
);
CREATE INDEX IF NOT EXISTS idx_pool_teams_pool
  ON public.pool_teams (tournament_pool_id);

-- ----------------------------------------------------------------------------
-- 5. bracket_slots — the playoff bracket structure + advancement pointers.
--    Slots are filled as the bracket resolves; advances_to_slot_id wires the
--    winner of this slot into the next round. event_id ties the slot to the
--    scheduled bracket game (location + time), supporting "where/when is the
--    bracket game" from the operator directive.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bracket_slots (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                  uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  tournament_division_id  uuid NOT NULL REFERENCES public.tournament_divisions(id) ON DELETE CASCADE,
  round                   text NOT NULL,               -- 'round_of_16','quarterfinal','semifinal','final','third_place'
  slot_index              integer NOT NULL,            -- position within the round (0-based)
  seed_source             text,                        -- human label: "Pool A #1", "Winner SF1"
  division_team_id        uuid REFERENCES public.tournament_division_teams(id) ON DELETE SET NULL,  -- filled as it resolves
  event_id                uuid REFERENCES public.events(id) ON DELETE SET NULL,                     -- the scheduled bracket game
  advances_to_slot_id     uuid REFERENCES public.bracket_slots(id) ON DELETE SET NULL,              -- winner advances here
  created_at              timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT bracket_slots_unique UNIQUE (tournament_division_id, round, slot_index)
);
CREATE INDEX IF NOT EXISTS idx_bracket_slots_division
  ON public.bracket_slots (tournament_division_id, round, slot_index);

-- ----------------------------------------------------------------------------
-- 6. Link GAMES to their division/pool so standings can be scoped.
--    Pool-play games carry both; bracket games carry division only (pool NULL).
--    Nullable + ON DELETE SET NULL so non-tournament events are unaffected.
-- ----------------------------------------------------------------------------
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS tournament_division_id uuid REFERENCES public.tournament_divisions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS tournament_pool_id     uuid REFERENCES public.tournament_pools(id)     ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_events_tournament_division
  ON public.events (tournament_division_id) WHERE tournament_division_id IS NOT NULL;

-- ----------------------------------------------------------------------------
-- 7. RLS — STAFF (authenticated, org-scoped) only. Public anon read is deferred
--    to the SECDEF get_public_* RPC that ships with the standings engine (D-FV4),
--    matching get_public_team_schedule. All five tables carry org_id, so policies
--    filter on it directly (AP #37). Separate per-command policies with explicit
--    WITH CHECK on writes (AP #20 — never a cmd=ALL policy with NULL with_check).
-- ----------------------------------------------------------------------------
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'tournament_divisions','tournament_division_teams','tournament_pools',
    'pool_teams','bracket_slots'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);

    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', t||'_select', t);
    EXECUTE format($f$CREATE POLICY %I ON public.%I
        FOR SELECT TO authenticated
        USING (org_id = public.current_user_org_id());$f$, t||'_select', t);

    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', t||'_insert', t);
    EXECUTE format($f$CREATE POLICY %I ON public.%I
        FOR INSERT TO authenticated
        WITH CHECK (public.user_has_role_in_org(org_id, ARRAY['admin'::text,'coach'::text]));$f$, t||'_insert', t);

    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', t||'_update', t);
    EXECUTE format($f$CREATE POLICY %I ON public.%I
        FOR UPDATE TO authenticated
        USING (public.user_has_role_in_org(org_id, ARRAY['admin'::text,'coach'::text]))
        WITH CHECK (public.user_has_role_in_org(org_id, ARRAY['admin'::text,'coach'::text]));$f$, t||'_update', t);

    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', t||'_delete', t);
    EXECUTE format($f$CREATE POLICY %I ON public.%I
        FOR DELETE TO authenticated
        USING (public.user_has_role_in_org(org_id, ARRAY['admin'::text,'coach'::text]));$f$, t||'_delete', t);

    -- RLS enforces access; column privileges mirror the divisions table.
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated, service_role;', t);
  END LOOP;
END $$;

NOTIFY pgrst, 'reload schema';

COMMIT;

-- ============================================================================
-- OPEN QUESTIONS FOR THE ARCHITECT (resolve before this is applied)
-- ============================================================================
-- OQ1  GAME→DIVISION LINK: I added nullable events.tournament_division_id +
--      events.tournament_pool_id (§6) rather than a separate join table. events
--      is a hot table but the FKs are nullable + SET NULL, and "a tournament game
--      belongs to one division/pool" is 1:1. Confirm columns-on-events vs a
--      tournament_game_divisions join. CC lean: columns-on-events (1:1, simplest).
--
-- OQ2  STANDINGS UNIT MODEL (§2): tournament_division_teams allows team_id XOR
--      opponent_id XOR name-only, because a division is mostly opponents we don't
--      run. Confirm this is the right standings unit (vs. forcing every division
--      team into the opponents table). CC lean: keep the 3-way identity — the
--      scraper often has only a name, and opponents is org-scoped curation we may
--      not want to pollute with every external team.
--
-- OQ3  PUBLIC EXPOSURE: this migration gives STAFF RLS only; the anon hub reads
--      standings via a SECDEF get_public_tournament_standings(...) RPC shipped
--      with the D-FV4 engine (matches get_public_team_schedule; revoke public+anon
--      then grant). Confirm RPC-for-anon (vs opening anon table SELECT gated by
--      org_is_public_listed). CC lean: SECDEF RPC — consistent with what we ship,
--      and it can bake in the published-only + cap-applied shape.
--
-- OQ4  championship_scenarios (already exists, hand-authored narrative rows):
--      the D-FV5 deterministic predictor supersedes manual scenarios. Deprecate it
--      (DEPRECATIONS_REGISTRY) once the predictor ships, or keep for editorial
--      overrides? CC lean: keep short-term as an editorial override surface; mark
--      for review once the predictor is live. (No change to it in this migration.)
--
-- OQ5  advance_count default = 2 (top-2 advance) matches Frank's directive; some
--      divisions advance top-1 or a wildcard. It's a per-division column so it's
--      configurable — confirm 2 is the right default.
-- ============================================================================

-- ============================================================================
-- RATIFICATION UPDATE 2026-06-26 (architect) -- the OQs above are now ANSWERED.
-- (ARCHITECT_RATIFICATION_AAU_FAMILY_2026-06-26.txt section 1)
-- ============================================================================
-- OQ1 RESOLVED: columns on events (1:1). Bracket games scoped via
--      bracket_slots.event_id, not a column. (As drafted, section 6.)
-- OQ2 RESOLVED: keep the 3-way XOR WITH the three guards, now APPLIED in the
--      tournament_division_teams table above: (i) name normalized via
--      lower(btrim(...)) inside the generated resolved_key; (ii)
--      UNIQUE(division, resolved_key) so a team can't appear twice and split its
--      standings; (iii) promotion path preserved (PK stable on promote; games
--      keyed to the row id survive). Escalation NAMED, not built: a scraped_teams
--      entity table for stable external ids if names get messy. Engine groups by
--      resolved identity (computeStandings.js).
-- OQ3 RESOLVED: SECDEF get_public_tournament_standings(...) RPC (drafted with the
--      engine); tables stay locked, no anon SELECT. "Cap-applied" lives in the
--      rules the RPC returns; the JS engine APPLIES the cap so the standings table
--      and the D-FV5 predictor compute from ONE source (AP #63). The RPC returns
--      raw published games + teams + rules; it does NOT re-rank in SQL.
-- OQ4 RESOLVED: no change here. Direction: once D-FV5 ships, deprecate / demote
--      championship_scenarios to pure narrative color, never a math override.
-- OQ5 RESOLVED: advance_count default 2 is fine; the PREDICTOR (engine) treats it
--      as required-confirmed per division before publishing odds -- unconfirmed ->
--      show standings, advancement "TBD", withhold odds (advanceCount=null ->
--      advances=null in computeStandings).
--
-- NEW -- OQ6 (surfaced by writing the engine against this shape): full division
--      standings need EVERY game in the division, including opponent-vs-opponent
--      games. Those have no events row (we aren't in them) and no game_results row
--      (it is our-team-centric: team_id + opponent). So the events-scoped link in
--      section 6 covers OUR games only; the rest of the scraped division board has
--      nowhere to land. The engine already takes a generic games array (aId/bId/
--      scores), so the gap is purely STORAGE. Options:
--        (a) a division_games table keyed to the standings unit
--            (tournament_division_id, home_div_team_id, away_div_team_id, scores,
--            status, external_game_id) holding ALL division games; our games mirror
--            into it (or it becomes the single game source for standings).
--        (b) game_results for our games + a thin external_division_games table for
--            opponent-vs-opponent; engine unions them.
--      CC lean: (a) -- one games source per division keyed to the standings unit is
--      the cleanest engine/predictor input, and the scraper already pulls the whole
--      division board. Flagged for the architect; NOT built in this draft.
-- ============================================================================

-- ============================================================================
-- OQ6 RULED: OPTION A (external-only model) — division_games table
-- (ARCHITECT response R6, 2026-06-26). Added below for owner-apply with the rest.
-- ============================================================================
-- Authority model (the part that must be right): division_games holds
-- EXTERNAL-vs-EXTERNAL games ONLY. Our games stay authoritative in
-- game_results/events; the public standings RPC UNIONs (our games scoped by
-- tournament_division_id) + (external games here) before feeding the engine. So
-- every game has exactly ONE source — no mirror job, no conflict rule, no drift,
-- and our official score can never be shadowed by a scraped one. Both sides
-- reference tournament_division_teams (the standings units, by resolved identity)
-- so the engine groups consistently.
BEGIN;

CREATE TABLE IF NOT EXISTS public.division_games (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                  uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  tournament_division_id  uuid NOT NULL REFERENCES public.tournament_divisions(id) ON DELETE CASCADE,
  tournament_pool_id      uuid REFERENCES public.tournament_pools(id) ON DELETE SET NULL,
  home_division_team_id   uuid NOT NULL REFERENCES public.tournament_division_teams(id) ON DELETE CASCADE,
  away_division_team_id   uuid NOT NULL REFERENCES public.tournament_division_teams(id) ON DELETE CASCADE,
  home_score              integer,
  away_score              integer,
  status                  text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','live','final')),
  start_at                timestamptz,
  external_game_id        text,                                  -- TM game id; scraper idempotency
  created_at              timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT division_games_distinct CHECK (home_division_team_id <> away_division_team_id),
  CONSTRAINT division_games_extkey_unique UNIQUE (tournament_division_id, external_game_id)
);
CREATE INDEX IF NOT EXISTS idx_division_games_division ON public.division_games (tournament_division_id, status);

-- EXTERNAL-only enforcement: neither side may be one of OUR teams. A standings unit
-- is "ours" iff its tournament_division_teams.team_id IS NOT NULL. Our games belong in
-- game_results/events, never here. Trigger (fires for every writer incl. service_role).
CREATE OR REPLACE FUNCTION public.assert_division_game_external()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE ours int;
BEGIN
  SELECT count(*) INTO ours
  FROM public.tournament_division_teams tdt
  WHERE tdt.id IN (NEW.home_division_team_id, NEW.away_division_team_id)
    AND tdt.team_id IS NOT NULL;
  IF ours > 0 THEN
    RAISE EXCEPTION 'division_games is external-vs-external only; a game involving one of our teams belongs in game_results/events (game %)', NEW.external_game_id;
  END IF;
  RETURN NEW;
END;
$fn$;
DROP TRIGGER IF EXISTS trg_division_game_external ON public.division_games;
CREATE TRIGGER trg_division_game_external
  BEFORE INSERT OR UPDATE ON public.division_games
  FOR EACH ROW EXECUTE FUNCTION public.assert_division_game_external();

-- RLS: same posture as the rest of the standings substrate — STAFF/service-role write
-- (the scraper ingests via the authenticated cross-program path, still its own review),
-- NO anon write; public READ is via get_public_tournament_standings only.
ALTER TABLE public.division_games ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS division_games_select ON public.division_games;
CREATE POLICY division_games_select ON public.division_games
  FOR SELECT TO authenticated USING (org_id = public.current_user_org_id());
DROP POLICY IF EXISTS division_games_insert ON public.division_games;
CREATE POLICY division_games_insert ON public.division_games
  FOR INSERT TO authenticated WITH CHECK (public.user_has_role_in_org(org_id, ARRAY['admin'::text,'coach'::text]));
DROP POLICY IF EXISTS division_games_update ON public.division_games;
CREATE POLICY division_games_update ON public.division_games
  FOR UPDATE TO authenticated USING (public.user_has_role_in_org(org_id, ARRAY['admin'::text,'coach'::text]))
  WITH CHECK (public.user_has_role_in_org(org_id, ARRAY['admin'::text,'coach'::text]));
DROP POLICY IF EXISTS division_games_delete ON public.division_games;
CREATE POLICY division_games_delete ON public.division_games
  FOR DELETE TO authenticated USING (public.user_has_role_in_org(org_id, ARRAY['admin'::text,'coach'::text]));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.division_games TO authenticated, service_role;

NOTIFY pgrst, 'reload schema';
COMMIT;
-- OQ6 RESOLVED -> the D-FV3 standings substrate is now COMPLETE and apply-ready.
-- ============================================================================

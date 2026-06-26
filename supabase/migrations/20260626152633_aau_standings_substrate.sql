-- Track-0 AAU standings substrate (D-FV3 option B + OQ6 Option A division_games).
-- Architect-ratified; owner-approved + MCP-applied 2026-06-26. Mirror of the applied
-- migration (design draft: docs/TRACK0_STANDINGS_SCHEMA_DRAFT_2026-06-26.sql).

CREATE TABLE IF NOT EXISTS public.tournament_divisions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  tournament_id   uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  name            text NOT NULL,
  grade_label     text,
  grade_min       integer,
  grade_max       integer,
  gender          text CHECK (gender IN ('M','F','Coed')),
  circuit         text,
  advance_count   integer NOT NULL DEFAULT 2,
  bracket_size    integer,
  sort_order      integer NOT NULL DEFAULT 0,
  external_division_key text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT tournament_divisions_unique UNIQUE (tournament_id, name)
);
CREATE INDEX IF NOT EXISTS idx_tournament_divisions_tournament ON public.tournament_divisions (tournament_id, sort_order);
CREATE UNIQUE INDEX IF NOT EXISTS idx_tournament_divisions_extkey ON public.tournament_divisions (tournament_id, external_division_key) WHERE external_division_key IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.tournament_division_teams (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                  uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  tournament_division_id  uuid NOT NULL REFERENCES public.tournament_divisions(id) ON DELETE CASCADE,
  team_id                 uuid REFERENCES public.teams(id) ON DELETE CASCADE,
  opponent_id             uuid REFERENCES public.opponents(id) ON DELETE CASCADE,
  display_name            text NOT NULL,
  external_team_key       text,
  seed                    integer,
  sort_order              integer NOT NULL DEFAULT 0,
  created_at              timestamptz NOT NULL DEFAULT now(),
  resolved_key            text GENERATED ALWAYS AS (COALESCE(team_id::text, opponent_id::text, lower(btrim(display_name)))) STORED,
  CONSTRAINT tdt_one_identity CHECK (num_nonnulls(team_id, opponent_id) <= 1),
  CONSTRAINT tournament_division_teams_resolved_unique UNIQUE (tournament_division_id, resolved_key)
);
CREATE INDEX IF NOT EXISTS idx_tdt_division ON public.tournament_division_teams (tournament_division_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_tdt_team ON public.tournament_division_teams (team_id) WHERE team_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.tournament_pools (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                  uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  tournament_division_id  uuid NOT NULL REFERENCES public.tournament_divisions(id) ON DELETE CASCADE,
  name                    text NOT NULL,
  sort_order              integer NOT NULL DEFAULT 0,
  created_at              timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT tournament_pools_unique UNIQUE (tournament_division_id, name)
);
CREATE INDEX IF NOT EXISTS idx_tournament_pools_division ON public.tournament_pools (tournament_division_id, sort_order);

CREATE TABLE IF NOT EXISTS public.pool_teams (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                      uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  tournament_pool_id          uuid NOT NULL REFERENCES public.tournament_pools(id) ON DELETE CASCADE,
  tournament_division_team_id uuid NOT NULL REFERENCES public.tournament_division_teams(id) ON DELETE CASCADE,
  seed                        integer,
  created_at                  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pool_teams_unique UNIQUE (tournament_pool_id, tournament_division_team_id)
);
CREATE INDEX IF NOT EXISTS idx_pool_teams_pool ON public.pool_teams (tournament_pool_id);

CREATE TABLE IF NOT EXISTS public.bracket_slots (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                  uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  tournament_division_id  uuid NOT NULL REFERENCES public.tournament_divisions(id) ON DELETE CASCADE,
  round                   text NOT NULL,
  slot_index              integer NOT NULL,
  seed_source             text,
  division_team_id        uuid REFERENCES public.tournament_division_teams(id) ON DELETE SET NULL,
  event_id                uuid REFERENCES public.events(id) ON DELETE SET NULL,
  advances_to_slot_id     uuid REFERENCES public.bracket_slots(id) ON DELETE SET NULL,
  created_at              timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT bracket_slots_unique UNIQUE (tournament_division_id, round, slot_index)
);
CREATE INDEX IF NOT EXISTS idx_bracket_slots_division ON public.bracket_slots (tournament_division_id, round, slot_index);

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS tournament_division_id uuid REFERENCES public.tournament_divisions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS tournament_pool_id     uuid REFERENCES public.tournament_pools(id)     ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_events_tournament_division ON public.events (tournament_division_id) WHERE tournament_division_id IS NOT NULL;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['tournament_divisions','tournament_division_teams','tournament_pools','pool_teams','bracket_slots'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', t||'_select', t);
    EXECUTE format($f$CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (org_id = public.current_user_org_id());$f$, t||'_select', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', t||'_insert', t);
    EXECUTE format($f$CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (public.user_has_role_in_org(org_id, ARRAY['admin'::text,'coach'::text]));$f$, t||'_insert', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', t||'_update', t);
    EXECUTE format($f$CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (public.user_has_role_in_org(org_id, ARRAY['admin'::text,'coach'::text])) WITH CHECK (public.user_has_role_in_org(org_id, ARRAY['admin'::text,'coach'::text]));$f$, t||'_update', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', t||'_delete', t);
    EXECUTE format($f$CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING (public.user_has_role_in_org(org_id, ARRAY['admin'::text,'coach'::text]));$f$, t||'_delete', t);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated, service_role;', t);
  END LOOP;
END $$;

-- OQ6 Option A: division_games (external-vs-external only)
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
  external_game_id        text,
  created_at              timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT division_games_distinct CHECK (home_division_team_id <> away_division_team_id),
  CONSTRAINT division_games_extkey_unique UNIQUE (tournament_division_id, external_game_id)
);
CREATE INDEX IF NOT EXISTS idx_division_games_division ON public.division_games (tournament_division_id, status);

CREATE OR REPLACE FUNCTION public.assert_division_game_external()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE ours int;
BEGIN
  SELECT count(*) INTO ours FROM public.tournament_division_teams tdt
  WHERE tdt.id IN (NEW.home_division_team_id, NEW.away_division_team_id) AND tdt.team_id IS NOT NULL;
  IF ours > 0 THEN
    RAISE EXCEPTION 'division_games is external-vs-external only; a game involving one of our teams belongs in game_results/events (game %)', NEW.external_game_id;
  END IF;
  RETURN NEW;
END;
$fn$;
DROP TRIGGER IF EXISTS trg_division_game_external ON public.division_games;
CREATE TRIGGER trg_division_game_external BEFORE INSERT OR UPDATE ON public.division_games FOR EACH ROW EXECUTE FUNCTION public.assert_division_game_external();

ALTER TABLE public.division_games ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS division_games_select ON public.division_games;
CREATE POLICY division_games_select ON public.division_games FOR SELECT TO authenticated USING (org_id = public.current_user_org_id());
DROP POLICY IF EXISTS division_games_insert ON public.division_games;
CREATE POLICY division_games_insert ON public.division_games FOR INSERT TO authenticated WITH CHECK (public.user_has_role_in_org(org_id, ARRAY['admin'::text,'coach'::text]));
DROP POLICY IF EXISTS division_games_update ON public.division_games;
CREATE POLICY division_games_update ON public.division_games FOR UPDATE TO authenticated USING (public.user_has_role_in_org(org_id, ARRAY['admin'::text,'coach'::text])) WITH CHECK (public.user_has_role_in_org(org_id, ARRAY['admin'::text,'coach'::text]));
DROP POLICY IF EXISTS division_games_delete ON public.division_games;
CREATE POLICY division_games_delete ON public.division_games FOR DELETE TO authenticated USING (public.user_has_role_in_org(org_id, ARRAY['admin'::text,'coach'::text]));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.division_games TO authenticated, service_role;

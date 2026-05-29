-- Migration #3 (EMBER_PROGRAM_SETUP_SPEC_v2 build, PR 3): seasons table -> compat view over programs.
-- Spec §4.5 step 3. programs becomes the single source of truth; seasons survives as a
-- backwards-compatible, security_invoker, auto-updatable view (existing reads + the rollover
-- writes keep working). Atomic: any failure rolls the whole migration back.
-- Dependency surface (2026-05-29 pre-flight): 8 external FKs reference seasons(id), 2 dependent
-- views (player_attendance_season, player_rsvp_season, both security_invoker), the updated_at
-- trigger, AND 2 RLS policies on season_locations (select/write) whose qual subqueries
-- read FROM seasons — those are repointed to programs here. All season ids are mirrored in
-- programs (PR 2 backfill) so FK repoints validate instantly. Applied via Supabase MCP 2026-05-29
-- (version 20260529185046).

-- 1. Repoint the 8 external FKs from seasons(id) to programs(id), preserving on-delete behavior.
ALTER TABLE public.teams              DROP CONSTRAINT teams_season_id_fkey,
  ADD CONSTRAINT teams_season_id_fkey FOREIGN KEY (season_id) REFERENCES public.programs(id) ON DELETE CASCADE;
ALTER TABLE public.events             DROP CONSTRAINT events_season_id_fkey,
  ADD CONSTRAINT events_season_id_fkey FOREIGN KEY (season_id) REFERENCES public.programs(id) ON DELETE SET NULL;
ALTER TABLE public.financial_accounts DROP CONSTRAINT financial_accounts_season_id_fkey,
  ADD CONSTRAINT financial_accounts_season_id_fkey FOREIGN KEY (season_id) REFERENCES public.programs(id) ON DELETE CASCADE;
ALTER TABLE public.coach_payouts      DROP CONSTRAINT coach_payouts_season_id_fkey,
  ADD CONSTRAINT coach_payouts_season_id_fkey FOREIGN KEY (season_id) REFERENCES public.programs(id) ON DELETE NO ACTION;
ALTER TABLE public.team_achievements  DROP CONSTRAINT team_achievements_season_id_fkey,
  ADD CONSTRAINT team_achievements_season_id_fkey FOREIGN KEY (season_id) REFERENCES public.programs(id) ON DELETE SET NULL;
ALTER TABLE public.season_locations   DROP CONSTRAINT season_locations_season_id_fkey,
  ADD CONSTRAINT season_locations_season_id_fkey FOREIGN KEY (season_id) REFERENCES public.programs(id) ON DELETE CASCADE;
ALTER TABLE public.season_rollovers   DROP CONSTRAINT season_rollovers_from_season_id_fkey,
  ADD CONSTRAINT season_rollovers_from_season_id_fkey FOREIGN KEY (from_season_id) REFERENCES public.programs(id) ON DELETE NO ACTION;
ALTER TABLE public.season_rollovers   DROP CONSTRAINT season_rollovers_to_season_id_fkey,
  ADD CONSTRAINT season_rollovers_to_season_id_fkey FOREIGN KEY (to_season_id) REFERENCES public.programs(id) ON DELETE NO ACTION;

-- 2. Drop the season_locations RLS policies that read FROM seasons (recreated against programs in step 6).
DROP POLICY season_locations_select ON public.season_locations;
DROP POLICY season_locations_write  ON public.season_locations;

-- 3. Drop the 2 dependent views (recreated verbatim in step 5).
DROP VIEW IF EXISTS public.player_attendance_season;
DROP VIEW IF EXISTS public.player_rsvp_season;

-- 4. Drop the seasons table (no CASCADE: fails loudly if an unforeseen dependency remains).
DROP TABLE public.seasons;

-- 5. Recreate seasons as a backwards-compat view over programs.
--    security_invoker=true → programs RLS enforced against the querying user (not the view owner).
--    Auto-updatable (simple single-table projection + column rename) + WITH CHECK OPTION so writes
--    through the view (useSeasons UPDATE, useSeasonRollover INSERT) land as program_type='season'
--    (programs.program_type DEFAULT 'season' supplies it on insert; sport_id defaults NULL).
CREATE VIEW public.seasons WITH (security_invoker=true) AS
  SELECT id, org_id, name, start_date, end_date, status, created_at, updated_at,
         parent_program_id AS parent_season_id, rolled_over_at
  FROM public.programs
  WHERE program_type = 'season'
  WITH CHECK OPTION;
GRANT ALL ON public.seasons TO anon, authenticated, service_role;

CREATE VIEW public.player_attendance_season WITH (security_invoker=true) AS
 WITH season_events AS (
         SELECT e.id AS event_id, e.team_id, e.event_type, e.start_at, s.id AS season_id, s.org_id
           FROM events e JOIN seasons s ON s.id = e.season_id
          WHERE s.status = 'active'::text AND e.status <> 'cancelled'::text AND e.start_at <= now()
        ), player_events AS (
         SELECT rm.player_id, rm.team_id, se.org_id, se.season_id, se.event_id, se.event_type, se.start_at,
                CASE WHEN ci.checked_in = true THEN 1 ELSE 0 END AS attended
           FROM season_events se
             JOIN roster_members rm ON rm.team_id = se.team_id AND rm.registered_at::date <= se.start_at::date AND (rm.left_at IS NULL OR rm.left_at::date > se.start_at::date)
             LEFT JOIN event_rsvps er ON er.event_id = se.event_id AND er.player_id = rm.player_id
             LEFT JOIN check_ins ci ON ci.event_id = se.event_id AND ci.player_id = rm.player_id
          WHERE COALESCE(er.response, ''::text) <> 'not_going'::text
        )
 SELECT player_id, team_id, org_id, season_id,
    count(DISTINCT event_id) AS events_eligible,
    sum(attended) AS events_attended,
    CASE WHEN count(DISTINCT event_id) > 0 THEN round(100.0 * sum(attended)::numeric / count(DISTINCT event_id)::numeric, 1) ELSE NULL::numeric END AS attendance_pct,
    count(DISTINCT event_id) FILTER (WHERE event_type = 'practice'::text) AS practices_eligible,
    sum(attended) FILTER (WHERE event_type = 'practice'::text) AS practices_attended,
    count(DISTINCT event_id) FILTER (WHERE event_type = 'game'::text) AS games_eligible,
    sum(attended) FILTER (WHERE event_type = 'game'::text) AS games_attended,
    count(DISTINCT event_id) FILTER (WHERE event_type = 'tournament'::text) AS tournaments_eligible,
    sum(attended) FILTER (WHERE event_type = 'tournament'::text) AS tournaments_attended,
    max(start_at) FILTER (WHERE attended = 1) AS last_attended_at,
    now() AS computed_at
   FROM player_events
  GROUP BY player_id, team_id, org_id, season_id;
GRANT ALL ON public.player_attendance_season TO anon, authenticated, service_role;

CREATE VIEW public.player_rsvp_season WITH (security_invoker=true) AS
 WITH season_events AS (
         SELECT e.id AS event_id, e.team_id, e.event_type, e.start_at, s.id AS season_id, s.org_id
           FROM events e JOIN seasons s ON s.id = e.season_id
          WHERE s.status = 'active'::text AND e.status <> 'cancelled'::text
        ), player_rsvp AS (
         SELECT rm.player_id, rm.team_id, se.org_id, se.season_id, se.event_id, se.event_type, er.response
           FROM season_events se
             JOIN roster_members rm ON rm.team_id = se.team_id AND rm.registered_at::date <= se.start_at::date AND (rm.left_at IS NULL OR rm.left_at::date > se.start_at::date)
             LEFT JOIN event_rsvps er ON er.event_id = se.event_id AND er.player_id = rm.player_id
        )
 SELECT player_id, team_id, org_id, season_id,
    count(DISTINCT event_id) AS events_eligible,
    count(DISTINCT event_id) FILTER (WHERE response = 'going'::text) AS rsvp_going,
    count(DISTINCT event_id) FILTER (WHERE response = 'maybe'::text) AS rsvp_maybe,
    count(DISTINCT event_id) FILTER (WHERE response = 'not_going'::text) AS rsvp_not_going,
    count(DISTINCT event_id) FILTER (WHERE response IS NOT NULL) AS rsvp_responded,
    CASE WHEN count(DISTINCT event_id) > 0 THEN round(100.0 * count(DISTINCT event_id) FILTER (WHERE response = 'going'::text)::numeric / count(DISTINCT event_id)::numeric, 1) ELSE NULL::numeric END AS going_pct,
    CASE WHEN count(DISTINCT event_id) > 0 THEN round(100.0 * count(DISTINCT event_id) FILTER (WHERE response IS NOT NULL)::numeric / count(DISTINCT event_id)::numeric, 1) ELSE NULL::numeric END AS response_pct,
    now() AS computed_at
   FROM player_rsvp
  GROUP BY player_id, team_id, org_id, season_id;
GRANT ALL ON public.player_rsvp_season TO anon, authenticated, service_role;

-- 6. Recreate the season_locations policies, now reading FROM programs (program_type='season').
CREATE POLICY season_locations_select ON public.season_locations
  FOR SELECT TO authenticated
  USING (season_id IN (SELECT p.id FROM public.programs p
           WHERE p.program_type = 'season'
             AND user_has_role_in_org(p.org_id, ARRAY['admin'::text,'coach'::text,'parent'::text])));
CREATE POLICY season_locations_write ON public.season_locations
  FOR ALL TO authenticated
  USING (season_id IN (SELECT p.id FROM public.programs p
           WHERE p.program_type = 'season'
             AND user_has_role_in_org(p.org_id, ARRAY['admin'::text])))
  WITH CHECK (season_id IN (SELECT p.id FROM public.programs p
           WHERE p.program_type = 'season'
             AND user_has_role_in_org(p.org_id, ARRAY['admin'::text])));

-- 7. Verify.
DO $$
DECLARE v_fk_on_seasons int; v_fk_on_programs int; v_view_rows int; v_sl_policies int;
BEGIN
  IF (SELECT relkind FROM pg_class WHERE oid='public.seasons'::regclass) <> 'v' THEN
    RAISE EXCEPTION 'verify failed: seasons is not a view';
  END IF;
  SELECT count(*) INTO v_fk_on_seasons FROM pg_constraint WHERE contype='f' AND confrelid='public.seasons'::regclass;
  IF v_fk_on_seasons <> 0 THEN
    RAISE EXCEPTION 'verify failed: % FKs still reference seasons', v_fk_on_seasons;
  END IF;
  SELECT count(*) INTO v_fk_on_programs FROM pg_constraint
    WHERE contype='f' AND confrelid='public.programs'::regclass
      AND conname IN ('teams_season_id_fkey','events_season_id_fkey','financial_accounts_season_id_fkey',
                      'coach_payouts_season_id_fkey','team_achievements_season_id_fkey','season_locations_season_id_fkey',
                      'season_rollovers_from_season_id_fkey','season_rollovers_to_season_id_fkey');
  IF v_fk_on_programs <> 8 THEN
    RAISE EXCEPTION 'verify failed: expected 8 repointed FKs on programs, got %', v_fk_on_programs;
  END IF;
  SELECT count(*) INTO v_view_rows FROM public.seasons;
  IF v_view_rows <> 3 THEN
    RAISE EXCEPTION 'verify failed: seasons view returns % rows (expected 3)', v_view_rows;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='seasons' AND column_name='parent_season_id') THEN
    RAISE EXCEPTION 'verify failed: seasons view missing parent_season_id column';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname='player_attendance_season' AND relkind='v')
     OR NOT EXISTS (SELECT 1 FROM pg_class WHERE relname='player_rsvp_season' AND relkind='v') THEN
    RAISE EXCEPTION 'verify failed: dependent views not recreated';
  END IF;
  SELECT count(*) INTO v_sl_policies FROM pg_policy WHERE polrelid='public.season_locations'::regclass
    AND polname IN ('season_locations_select','season_locations_write');
  IF v_sl_policies <> 2 THEN
    RAISE EXCEPTION 'verify failed: season_locations policies not recreated (got %)', v_sl_policies;
  END IF;
  RAISE NOTICE 'seasons -> view swap verified.';
END $$;

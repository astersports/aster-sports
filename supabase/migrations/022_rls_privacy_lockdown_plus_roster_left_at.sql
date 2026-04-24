-- ============================================================
-- 022_rls_privacy_lockdown_plus_roster_left_at.sql
--
-- Migration 022: Close 5 P0 RLS privacy holes + roster_members.left_at
--
-- VERSION HISTORY:
-- v1 (2026-04-24): Initial design with inline subqueries on user_roles
--   FAILED: caused infinite recursion on players policy chain
-- v2 (2026-04-24): Refactored to SECURITY DEFINER helper functions
--   per L99 anti-pattern (Part 9): never inline subquery user_roles
--   in RLS policies. Use helpers to break recursion chain.
--
-- HELPERS CREATED:
--   user_has_role_in_org(org_id, roles[]) -> boolean
--   current_user_guardian_id() -> uuid
--   current_user_player_ids() -> uuid[]
--   current_user_staff_team_ids() -> uuid[]
-- ============================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.user_has_role_in_org(check_org_id uuid, check_roles text[])
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND organization_id = check_org_id
      AND role = ANY(check_roles)
  );
$$;
GRANT EXECUTE ON FUNCTION public.user_has_role_in_org(uuid, text[]) TO authenticated;

CREATE OR REPLACE FUNCTION public.current_user_guardian_id()
RETURNS uuid LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public
AS $$ SELECT id FROM public.guardians WHERE user_id = auth.uid() LIMIT 1; $$;
GRANT EXECUTE ON FUNCTION public.current_user_guardian_id() TO authenticated;

CREATE OR REPLACE FUNCTION public.current_user_player_ids()
RETURNS uuid[] LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public
AS $$
  SELECT ARRAY(
    SELECT pg.player_id FROM public.player_guardians pg
    JOIN public.guardians g ON g.id = pg.guardian_id
    WHERE g.user_id = auth.uid()
  );
$$;
GRANT EXECUTE ON FUNCTION public.current_user_player_ids() TO authenticated;

CREATE OR REPLACE FUNCTION public.current_user_staff_team_ids()
RETURNS uuid[] LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public
AS $$ SELECT ARRAY(SELECT team_id FROM public.team_staff WHERE user_id = auth.uid()); $$;
GRANT EXECUTE ON FUNCTION public.current_user_staff_team_ids() TO authenticated;

ALTER TABLE public.guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roster_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_pool_teams ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "guardians_select_own" ON public.guardians;
DROP POLICY IF EXISTS "guardians_select_staff" ON public.guardians;
DROP POLICY IF EXISTS "guardians_update_own" ON public.guardians;
DROP POLICY IF EXISTS "guardians_insert_admin" ON public.guardians;
DROP POLICY IF EXISTS "guardians_update_admin" ON public.guardians;
DROP POLICY IF EXISTS "guardians_delete_admin" ON public.guardians;

CREATE POLICY "guardians_select_own" ON public.guardians FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "guardians_select_staff" ON public.guardians FOR SELECT TO authenticated USING (public.user_has_role_in_org(org_id, ARRAY['admin', 'coach']));
CREATE POLICY "guardians_update_own" ON public.guardians FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "guardians_insert_admin" ON public.guardians FOR INSERT TO authenticated WITH CHECK (public.user_has_role_in_org(org_id, ARRAY['admin']));
CREATE POLICY "guardians_update_admin" ON public.guardians FOR UPDATE TO authenticated USING (public.user_has_role_in_org(org_id, ARRAY['admin'])) WITH CHECK (public.user_has_role_in_org(org_id, ARRAY['admin']));
CREATE POLICY "guardians_delete_admin" ON public.guardians FOR DELETE TO authenticated USING (public.user_has_role_in_org(org_id, ARRAY['admin']));

DROP POLICY IF EXISTS "players_select_parent" ON public.players;
DROP POLICY IF EXISTS "players_select_staff" ON public.players;
DROP POLICY IF EXISTS "players_insert_admin" ON public.players;
DROP POLICY IF EXISTS "players_update_admin" ON public.players;
DROP POLICY IF EXISTS "players_update_coach" ON public.players;
DROP POLICY IF EXISTS "players_delete_admin" ON public.players;

CREATE POLICY "players_select_parent" ON public.players FOR SELECT TO authenticated USING (id = ANY(public.current_user_player_ids()));
CREATE POLICY "players_select_staff" ON public.players FOR SELECT TO authenticated USING (public.user_has_role_in_org(org_id, ARRAY['admin', 'coach']));
CREATE POLICY "players_insert_admin" ON public.players FOR INSERT TO authenticated WITH CHECK (public.user_has_role_in_org(org_id, ARRAY['admin']));
CREATE POLICY "players_update_admin" ON public.players FOR UPDATE TO authenticated USING (public.user_has_role_in_org(org_id, ARRAY['admin'])) WITH CHECK (public.user_has_role_in_org(org_id, ARRAY['admin']));
CREATE POLICY "players_update_coach" ON public.players FOR UPDATE TO authenticated
  USING (public.user_has_role_in_org(org_id, ARRAY['coach']) AND id IN (SELECT player_id FROM public.roster_members WHERE team_id = ANY(public.current_user_staff_team_ids())))
  WITH CHECK (public.user_has_role_in_org(org_id, ARRAY['coach']) AND id IN (SELECT player_id FROM public.roster_members WHERE team_id = ANY(public.current_user_staff_team_ids())));
CREATE POLICY "players_delete_admin" ON public.players FOR DELETE TO authenticated USING (public.user_has_role_in_org(org_id, ARRAY['admin']));

DROP POLICY IF EXISTS "player_guardians_select_parent" ON public.player_guardians;
DROP POLICY IF EXISTS "player_guardians_select_staff" ON public.player_guardians;
DROP POLICY IF EXISTS "player_guardians_write_admin" ON public.player_guardians;

CREATE POLICY "player_guardians_select_parent" ON public.player_guardians FOR SELECT TO authenticated USING (guardian_id = public.current_user_guardian_id());
CREATE POLICY "player_guardians_select_staff" ON public.player_guardians FOR SELECT TO authenticated
  USING (player_id IN (SELECT id FROM public.players WHERE public.user_has_role_in_org(org_id, ARRAY['admin', 'coach'])));
CREATE POLICY "player_guardians_write_admin" ON public.player_guardians FOR ALL TO authenticated
  USING (player_id IN (SELECT id FROM public.players WHERE public.user_has_role_in_org(org_id, ARRAY['admin'])))
  WITH CHECK (player_id IN (SELECT id FROM public.players WHERE public.user_has_role_in_org(org_id, ARRAY['admin'])));

DROP POLICY IF EXISTS "roster_members_select_own_child" ON public.roster_members;
DROP POLICY IF EXISTS "roster_members_select_staff" ON public.roster_members;
DROP POLICY IF EXISTS "roster_members_insert_admin" ON public.roster_members;
DROP POLICY IF EXISTS "roster_members_update_admin" ON public.roster_members;
DROP POLICY IF EXISTS "roster_members_update_coach" ON public.roster_members;
DROP POLICY IF EXISTS "roster_members_delete_admin" ON public.roster_members;

CREATE POLICY "roster_members_select_own_child" ON public.roster_members FOR SELECT TO authenticated USING (player_id = ANY(public.current_user_player_ids()));
CREATE POLICY "roster_members_select_staff" ON public.roster_members FOR SELECT TO authenticated
  USING (team_id IN (SELECT id FROM public.teams WHERE public.user_has_role_in_org(org_id, ARRAY['admin', 'coach'])));
CREATE POLICY "roster_members_insert_admin" ON public.roster_members FOR INSERT TO authenticated
  WITH CHECK (team_id IN (SELECT id FROM public.teams WHERE public.user_has_role_in_org(org_id, ARRAY['admin'])));
CREATE POLICY "roster_members_update_admin" ON public.roster_members FOR UPDATE TO authenticated
  USING (team_id IN (SELECT id FROM public.teams WHERE public.user_has_role_in_org(org_id, ARRAY['admin'])))
  WITH CHECK (team_id IN (SELECT id FROM public.teams WHERE public.user_has_role_in_org(org_id, ARRAY['admin'])));
CREATE POLICY "roster_members_update_coach" ON public.roster_members FOR UPDATE TO authenticated
  USING (team_id = ANY(public.current_user_staff_team_ids()))
  WITH CHECK (team_id = ANY(public.current_user_staff_team_ids()));
CREATE POLICY "roster_members_delete_admin" ON public.roster_members FOR DELETE TO authenticated
  USING (team_id IN (SELECT id FROM public.teams WHERE public.user_has_role_in_org(org_id, ARRAY['admin'])));

DROP POLICY IF EXISTS "tournament_pool_teams_select_org" ON public.tournament_pool_teams;
DROP POLICY IF EXISTS "tournament_pool_teams_write_staff" ON public.tournament_pool_teams;

CREATE POLICY "tournament_pool_teams_select_org" ON public.tournament_pool_teams FOR SELECT TO authenticated
  USING (tournament_id IN (SELECT id FROM public.tournaments WHERE public.user_has_role_in_org(org_id, ARRAY['admin', 'coach', 'parent'])));
CREATE POLICY "tournament_pool_teams_write_staff" ON public.tournament_pool_teams FOR ALL TO authenticated
  USING (tournament_id IN (SELECT id FROM public.tournaments WHERE public.user_has_role_in_org(org_id, ARRAY['admin', 'coach'])))
  WITH CHECK (tournament_id IN (SELECT id FROM public.tournaments WHERE public.user_has_role_in_org(org_id, ARRAY['admin', 'coach'])));

ALTER TABLE public.roster_members ADD COLUMN IF NOT EXISTS left_at timestamptz;
COMMENT ON COLUMN public.roster_members.left_at IS 'When the player left this team roster. NULL means still on active roster.';

ALTER TABLE public.roster_members DROP CONSTRAINT IF EXISTS roster_members_dates_coherent;
ALTER TABLE public.roster_members ADD CONSTRAINT roster_members_dates_coherent CHECK (left_at IS NULL OR left_at >= registered_at);

CREATE INDEX IF NOT EXISTS idx_roster_members_team_date_window ON public.roster_members (team_id, registered_at, left_at);
CREATE INDEX IF NOT EXISTS idx_roster_members_active ON public.roster_members (team_id, player_id) WHERE left_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_roster_members_player_active ON public.roster_members (player_id, team_id) WHERE left_at IS NULL;

DROP VIEW IF EXISTS public.roster_members_public;
CREATE VIEW public.roster_members_public WITH (security_invoker = true) AS
SELECT id, player_id, team_id, jersey_number, jersey_size, shorts_size, registered_at, left_at, created_at, updated_at
FROM public.roster_members;

NOTIFY pgrst, 'reload schema';

COMMIT;

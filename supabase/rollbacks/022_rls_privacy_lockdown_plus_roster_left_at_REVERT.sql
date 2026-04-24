-- ============================================================
-- 022_rls_privacy_lockdown_plus_roster_left_at_REVERT.sql
--
-- Reverts Migration 022. Use only in emergency.
--
-- WARNING: This restores the 5 P0 RLS privacy holes. Only run
-- if Migration 022 is causing app-breaking issues that cannot be
-- patched forward. Document reason and re-apply ASAP.
-- ============================================================

BEGIN;

-- Disable RLS on all 5 tables
ALTER TABLE public.guardians DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_guardians DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.players DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.roster_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_pool_teams DISABLE ROW LEVEL SECURITY;

-- Drop all 23 policies
DROP POLICY IF EXISTS "guardians_select_own" ON public.guardians;
DROP POLICY IF EXISTS "guardians_select_staff" ON public.guardians;
DROP POLICY IF EXISTS "guardians_update_own" ON public.guardians;
DROP POLICY IF EXISTS "guardians_insert_admin" ON public.guardians;
DROP POLICY IF EXISTS "guardians_update_admin" ON public.guardians;
DROP POLICY IF EXISTS "guardians_delete_admin" ON public.guardians;

DROP POLICY IF EXISTS "players_select_parent" ON public.players;
DROP POLICY IF EXISTS "players_select_staff" ON public.players;
DROP POLICY IF EXISTS "players_insert_admin" ON public.players;
DROP POLICY IF EXISTS "players_update_admin" ON public.players;
DROP POLICY IF EXISTS "players_update_coach" ON public.players;
DROP POLICY IF EXISTS "players_delete_admin" ON public.players;

DROP POLICY IF EXISTS "player_guardians_select_parent" ON public.player_guardians;
DROP POLICY IF EXISTS "player_guardians_select_staff" ON public.player_guardians;
DROP POLICY IF EXISTS "player_guardians_write_admin" ON public.player_guardians;

DROP POLICY IF EXISTS "roster_members_select_own_child" ON public.roster_members;
DROP POLICY IF EXISTS "roster_members_select_staff" ON public.roster_members;
DROP POLICY IF EXISTS "roster_members_insert_admin" ON public.roster_members;
DROP POLICY IF EXISTS "roster_members_update_admin" ON public.roster_members;
DROP POLICY IF EXISTS "roster_members_update_coach" ON public.roster_members;
DROP POLICY IF EXISTS "roster_members_delete_admin" ON public.roster_members;

DROP POLICY IF EXISTS "tournament_pool_teams_select_org" ON public.tournament_pool_teams;
DROP POLICY IF EXISTS "tournament_pool_teams_write_staff" ON public.tournament_pool_teams;

-- Drop the public VIEW
DROP VIEW IF EXISTS public.roster_members_public;

-- Drop our new indexes
DROP INDEX IF EXISTS public.idx_roster_members_team_date_window;
DROP INDEX IF EXISTS public.idx_roster_members_active;
DROP INDEX IF EXISTS public.idx_roster_members_player_active;

-- Drop CHECK constraint
ALTER TABLE public.roster_members
  DROP CONSTRAINT IF EXISTS roster_members_dates_coherent;

-- WARNING: left_at column is NOT dropped to preserve any data already
-- written. To fully revert, manually run:
--   ALTER TABLE public.roster_members DROP COLUMN left_at;

NOTIFY pgrst, 'reload schema';

COMMIT;

-- ============================================================
-- 022_rls_privacy_lockdown_plus_roster_left_at.sql
--
-- Migration 022 closes 5 P0 RLS privacy holes and adds
-- roster_members.left_at column (needed for Migration 023 attendance
-- views).
--
-- P0 HOLES CLOSED (verified April 24, 2026):
--   - guardians (120 rows of PII exposed to any authenticated user)
--   - player_guardians (108 rows exposing child-to-parent relationships)
--   - players (63 child records exposed)
--   - roster_members (63 rows + payment data exposed)
--   - tournament_pool_teams (0 rows now, but must be protected)
--
-- SCOPING PATHS:
--   - guardians: direct org_id
--   - player_guardians: via players.org_id
--   - players: direct org_id
--   - roster_members: via teams.org_id
--   - tournament_pool_teams: via tournaments.org_id
--
-- POLICY DECISIONS (Q1-Q7 locked):
--   Q1: Parents admin-only write on guardians (no coach write)
--   Q2: Coaches can UPDATE players on their own teams
--   Q3: Coaches can UPDATE roster_members on their own teams (except payment_status)
--   Q4: Parents read-only except own guardian record
--   Q5: Tournament_pool_teams staff-only writes
--   Q6: Parent payment visibility via view-based separation
--        (roster_members_public VIEW strips payment fields)
--   Q7: left_at column added to roster_members
--
-- FUTURE WORK (Phase 3): Admin-configurable RLS toggles via
-- organization_settings.rls_policies JSONB. Hardcoded defaults
-- shipped now since admin UI not yet ready.
--
-- Safe to re-apply: idempotent (DROP POLICY IF EXISTS + ENABLE RLS
-- + IF NOT EXISTS patterns).
-- ============================================================

BEGIN;

-- ============================================================
-- SECTION 1: Enable RLS on all 5 tables
-- ============================================================
ALTER TABLE public.guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roster_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_pool_teams ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- SECTION 2: guardians policies
-- ============================================================

-- Drop any pre-existing to keep idempotent
DROP POLICY IF EXISTS "guardians_select_own" ON public.guardians;
DROP POLICY IF EXISTS "guardians_select_staff" ON public.guardians;
DROP POLICY IF EXISTS "guardians_update_own" ON public.guardians;
DROP POLICY IF EXISTS "guardians_insert_admin" ON public.guardians;
DROP POLICY IF EXISTS "guardians_update_admin" ON public.guardians;
DROP POLICY IF EXISTS "guardians_delete_admin" ON public.guardians;

-- SELECT own guardian record (all authenticated users can read their own)
CREATE POLICY "guardians_select_own" ON public.guardians
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- SELECT staff: admins + coaches see all org guardians
CREATE POLICY "guardians_select_staff" ON public.guardians
  FOR SELECT TO authenticated
  USING (
    org_id IN (
      SELECT organization_id FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'coach')
    )
  );

-- UPDATE own guardian record (parents update their own name/email/phone)
CREATE POLICY "guardians_update_own" ON public.guardians
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- INSERT/UPDATE/DELETE admin only (Q1 locked: coaches NO write on guardians)
CREATE POLICY "guardians_insert_admin" ON public.guardians
  FOR INSERT TO authenticated
  WITH CHECK (
    org_id IN (
      SELECT organization_id FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "guardians_update_admin" ON public.guardians
  FOR UPDATE TO authenticated
  USING (
    org_id IN (
      SELECT organization_id FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    org_id IN (
      SELECT organization_id FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "guardians_delete_admin" ON public.guardians
  FOR DELETE TO authenticated
  USING (
    org_id IN (
      SELECT organization_id FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- SECTION 3: players policies (org_id direct)
-- ============================================================

DROP POLICY IF EXISTS "players_select_parent" ON public.players;
DROP POLICY IF EXISTS "players_select_staff" ON public.players;
DROP POLICY IF EXISTS "players_insert_admin" ON public.players;
DROP POLICY IF EXISTS "players_update_admin" ON public.players;
DROP POLICY IF EXISTS "players_update_coach" ON public.players;
DROP POLICY IF EXISTS "players_delete_admin" ON public.players;

-- Parent SELECT: only own children (via player_guardians -> guardians.user_id)
CREATE POLICY "players_select_parent" ON public.players
  FOR SELECT TO authenticated
  USING (
    id IN (
      SELECT pg.player_id
      FROM public.player_guardians pg
      JOIN public.guardians g ON g.id = pg.guardian_id
      WHERE g.user_id = auth.uid()
    )
  );

-- Staff SELECT: all in org
CREATE POLICY "players_select_staff" ON public.players
  FOR SELECT TO authenticated
  USING (
    org_id IN (
      SELECT organization_id FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'coach')
    )
  );

-- INSERT/UPDATE/DELETE admin
CREATE POLICY "players_insert_admin" ON public.players
  FOR INSERT TO authenticated
  WITH CHECK (
    org_id IN (
      SELECT organization_id FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "players_update_admin" ON public.players
  FOR UPDATE TO authenticated
  USING (
    org_id IN (
      SELECT organization_id FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    org_id IN (
      SELECT organization_id FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Coach UPDATE: players on their own teams (via roster_members + team_staff)
CREATE POLICY "players_update_coach" ON public.players
  FOR UPDATE TO authenticated
  USING (
    id IN (
      SELECT rm.player_id
      FROM public.roster_members rm
      JOIN public.team_staff ts ON ts.team_id = rm.team_id
      WHERE ts.user_id = auth.uid()
    )
    AND org_id IN (
      SELECT organization_id FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'coach'
    )
  )
  WITH CHECK (
    id IN (
      SELECT rm.player_id
      FROM public.roster_members rm
      JOIN public.team_staff ts ON ts.team_id = rm.team_id
      WHERE ts.user_id = auth.uid()
    )
    AND org_id IN (
      SELECT organization_id FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'coach'
    )
  );

CREATE POLICY "players_delete_admin" ON public.players
  FOR DELETE TO authenticated
  USING (
    org_id IN (
      SELECT organization_id FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- SECTION 4: player_guardians policies (no org_id, join via players)
-- ============================================================

DROP POLICY IF EXISTS "player_guardians_select_parent" ON public.player_guardians;
DROP POLICY IF EXISTS "player_guardians_select_staff" ON public.player_guardians;
DROP POLICY IF EXISTS "player_guardians_write_admin" ON public.player_guardians;

-- Parent SELECT: rows linking their own children
CREATE POLICY "player_guardians_select_parent" ON public.player_guardians
  FOR SELECT TO authenticated
  USING (
    guardian_id IN (
      SELECT id FROM public.guardians
      WHERE user_id = auth.uid()
    )
    OR
    player_id IN (
      SELECT pg.player_id
      FROM public.player_guardians pg
      JOIN public.guardians g ON g.id = pg.guardian_id
      WHERE g.user_id = auth.uid()
    )
  );

-- Staff SELECT: all rows in their org (scoped via players.org_id)
CREATE POLICY "player_guardians_select_staff" ON public.player_guardians
  FOR SELECT TO authenticated
  USING (
    player_id IN (
      SELECT p.id FROM public.players p
      WHERE p.org_id IN (
        SELECT organization_id FROM public.user_roles
        WHERE user_id = auth.uid() AND role IN ('admin', 'coach')
      )
    )
  );

-- INSERT/UPDATE/DELETE admin only
CREATE POLICY "player_guardians_write_admin" ON public.player_guardians
  FOR ALL TO authenticated
  USING (
    player_id IN (
      SELECT p.id FROM public.players p
      WHERE p.org_id IN (
        SELECT organization_id FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'admin'
      )
    )
  )
  WITH CHECK (
    player_id IN (
      SELECT p.id FROM public.players p
      WHERE p.org_id IN (
        SELECT organization_id FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'admin'
      )
    )
  );

-- ============================================================
-- SECTION 5: roster_members policies + public VIEW (Q6)
-- ============================================================

DROP POLICY IF EXISTS "roster_members_select_own_child" ON public.roster_members;
DROP POLICY IF EXISTS "roster_members_select_staff" ON public.roster_members;
DROP POLICY IF EXISTS "roster_members_insert_admin" ON public.roster_members;
DROP POLICY IF EXISTS "roster_members_update_admin" ON public.roster_members;
DROP POLICY IF EXISTS "roster_members_update_coach" ON public.roster_members;
DROP POLICY IF EXISTS "roster_members_delete_admin" ON public.roster_members;

-- Parent SELECT: own child's roster_member row (includes payment data for own child)
CREATE POLICY "roster_members_select_own_child" ON public.roster_members
  FOR SELECT TO authenticated
  USING (
    player_id IN (
      SELECT pg.player_id
      FROM public.player_guardians pg
      JOIN public.guardians g ON g.id = pg.guardian_id
      WHERE g.user_id = auth.uid()
    )
  );

-- Staff SELECT: all in org (scoped via teams.org_id)
CREATE POLICY "roster_members_select_staff" ON public.roster_members
  FOR SELECT TO authenticated
  USING (
    team_id IN (
      SELECT t.id FROM public.teams t
      WHERE t.org_id IN (
        SELECT organization_id FROM public.user_roles
        WHERE user_id = auth.uid() AND role IN ('admin', 'coach')
      )
    )
  );

-- INSERT admin only
CREATE POLICY "roster_members_insert_admin" ON public.roster_members
  FOR INSERT TO authenticated
  WITH CHECK (
    team_id IN (
      SELECT t.id FROM public.teams t
      WHERE t.org_id IN (
        SELECT organization_id FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'admin'
      )
    )
  );

-- UPDATE admin: all roster_members in org, all columns
CREATE POLICY "roster_members_update_admin" ON public.roster_members
  FOR UPDATE TO authenticated
  USING (
    team_id IN (
      SELECT t.id FROM public.teams t
      WHERE t.org_id IN (
        SELECT organization_id FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'admin'
      )
    )
  )
  WITH CHECK (
    team_id IN (
      SELECT t.id FROM public.teams t
      WHERE t.org_id IN (
        SELECT organization_id FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'admin'
      )
    )
  );

-- UPDATE coach: roster_members on their own teams
-- Note: payment_status column-level restriction enforced at app layer
-- (can tighten with column privilege GRANT later)
CREATE POLICY "roster_members_update_coach" ON public.roster_members
  FOR UPDATE TO authenticated
  USING (
    team_id IN (
      SELECT ts.team_id FROM public.team_staff ts
      WHERE ts.user_id = auth.uid()
    )
    AND team_id IN (
      SELECT t.id FROM public.teams t
      WHERE t.org_id IN (
        SELECT organization_id FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'coach'
      )
    )
  )
  WITH CHECK (
    team_id IN (
      SELECT ts.team_id FROM public.team_staff ts
      WHERE ts.user_id = auth.uid()
    )
    AND team_id IN (
      SELECT t.id FROM public.teams t
      WHERE t.org_id IN (
        SELECT organization_id FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'coach'
      )
    )
  );

CREATE POLICY "roster_members_delete_admin" ON public.roster_members
  FOR DELETE TO authenticated
  USING (
    team_id IN (
      SELECT t.id FROM public.teams t
      WHERE t.org_id IN (
        SELECT organization_id FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'admin'
      )
    )
  );

-- ============================================================
-- SECTION 6: tournament_pool_teams policies (via tournaments.org_id)
-- ============================================================

DROP POLICY IF EXISTS "tournament_pool_teams_select_org" ON public.tournament_pool_teams;
DROP POLICY IF EXISTS "tournament_pool_teams_write_staff" ON public.tournament_pool_teams;

-- SELECT: all org members (including parents for bracket visibility)
CREATE POLICY "tournament_pool_teams_select_org" ON public.tournament_pool_teams
  FOR SELECT TO authenticated
  USING (
    tournament_id IN (
      SELECT t.id FROM public.tournaments t
      WHERE t.org_id IN (
        SELECT organization_id FROM public.user_roles
        WHERE user_id = auth.uid()
      )
    )
  );

-- Staff writes only (admin + coach)
CREATE POLICY "tournament_pool_teams_write_staff" ON public.tournament_pool_teams
  FOR ALL TO authenticated
  USING (
    tournament_id IN (
      SELECT t.id FROM public.tournaments t
      WHERE t.org_id IN (
        SELECT organization_id FROM public.user_roles
        WHERE user_id = auth.uid() AND role IN ('admin', 'coach')
      )
    )
  )
  WITH CHECK (
    tournament_id IN (
      SELECT t.id FROM public.tournaments t
      WHERE t.org_id IN (
        SELECT organization_id FROM public.user_roles
        WHERE user_id = auth.uid() AND role IN ('admin', 'coach')
      )
    )
  );

-- ============================================================
-- SECTION 7: Add left_at column to roster_members (Q7)
-- ============================================================

ALTER TABLE public.roster_members
  ADD COLUMN IF NOT EXISTS left_at timestamptz;

COMMENT ON COLUMN public.roster_members.left_at IS
  'When the player left this team roster. NULL means still on active roster. Use UPDATE ... SET left_at = now() instead of DELETE to preserve roster history for attendance views, historical queries, and audit trails. Enables retrospective queries like "who was on 10U Black in April 2026".';

-- CHECK constraint: left_at must be after registered_at when set
ALTER TABLE public.roster_members
  DROP CONSTRAINT IF EXISTS roster_members_dates_coherent;
ALTER TABLE public.roster_members
  ADD CONSTRAINT roster_members_dates_coherent
  CHECK (left_at IS NULL OR left_at >= registered_at);

-- Composite index for date-window queries (needed by Migration 023 views)
CREATE INDEX IF NOT EXISTS idx_roster_members_team_date_window
  ON public.roster_members (team_id, registered_at, left_at);

-- Partial index for active roster queries
CREATE INDEX IF NOT EXISTS idx_roster_members_active
  ON public.roster_members (team_id, player_id)
  WHERE left_at IS NULL;

-- Partial index for player's active teams
CREATE INDEX IF NOT EXISTS idx_roster_members_player_active
  ON public.roster_members (player_id, team_id)
  WHERE left_at IS NULL;

-- ============================================================
-- SECTION 8: roster_members_public VIEW (Q6)
-- Excludes payment_status, amount_paid, amount_due columns.
-- Parents query this view for team roster display.
-- App layer: use roster_members directly for "my own child" queries
-- where payment data is needed.
-- ============================================================

DROP VIEW IF EXISTS public.roster_members_public;

CREATE VIEW public.roster_members_public
WITH (security_invoker = true)
AS
SELECT
  id,
  player_id,
  team_id,
  jersey_number,
  jersey_size,
  shorts_size,
  registered_at,
  left_at,
  created_at,
  updated_at
FROM public.roster_members;

COMMENT ON VIEW public.roster_members_public IS
  'Parent-facing view of roster_members excluding payment data (payment_status, amount_paid, amount_due). Uses security_invoker=true so caller RLS on underlying roster_members applies. Parents query this for team roster display; use roster_members directly for own-child queries needing payment visibility.';

-- ============================================================
-- SECTION 9: Reload PostgREST cache
-- ============================================================
NOTIFY pgrst, 'reload schema';

COMMIT;

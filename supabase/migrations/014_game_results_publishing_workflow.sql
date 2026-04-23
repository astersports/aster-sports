-- ============================================================
-- 014_game_results_publishing_workflow.sql
--
-- Adds draft -> publish workflow to game_results.
-- Supports Quick Score feature (Phase 2): coaches enter scores
-- as drafts visible only to staff, then publish to make results
-- visible to parents. private_notes is coach-only and never
-- surfaces to parents regardless of published state.
--
-- coach_highlight (existing column) stays parent-visible and is
-- reserved for its future purpose as the parent-facing one-liner
-- in briefings and event detail pages.
--
-- Key behaviors (per Frank decision April 23, 2026):
--   - Unpublish allowed: SET published_at = NULL is permitted
--   - Score edits after publish allowed, no trigger
--   - private_notes never visible to parents, any published state
--   - coach_highlight remains parent-visible
--
-- RLS enforcement (replaces existing game_results_read +
-- game_results_write policies which did NOT split parent vs staff):
--   - Parents: SELECT only rows WHERE published_at IS NOT NULL
--     AND limited to teams their children are on via guardians
--   - Coach/Admin: SELECT all rows in their org (draft + published)
--   - Coach/Admin: INSERT/UPDATE/DELETE in their org
--   - Parents: no write access
--
-- CRITICAL: without this migration's policy swap, parents can read
-- draft game_results once published_at exists. The DROP POLICY
-- statements use the REAL existing policy names, not guesses.
--
-- Safe to re-apply: idempotent.
-- ============================================================

BEGIN;

-- ------------------------------------------------------------
-- 1. Add publish workflow columns
-- ------------------------------------------------------------
ALTER TABLE public.game_results
  ADD COLUMN IF NOT EXISTS published_at timestamptz,
  ADD COLUMN IF NOT EXISTS published_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS private_notes text;

COMMENT ON COLUMN public.game_results.published_at IS
  'Timestamp when the result was published to parents. NULL means draft (coach/admin only). Setting to NULL un-publishes.';

COMMENT ON COLUMN public.game_results.published_by IS
  'User who most recently published this result. References auth.users, kept on unpublish for audit continuity.';

COMMENT ON COLUMN public.game_results.private_notes IS
  'Coach-only notes, never visible to parents regardless of published_at state. For tactical observations, player feedback, internal commentary. Distinct from coach_highlight which IS parent-visible.';

-- ------------------------------------------------------------
-- 2. Index for parent queries (published results only)
-- ------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_game_results_published_at
  ON public.game_results (published_at)
  WHERE published_at IS NOT NULL;

-- ------------------------------------------------------------
-- 3. Replace existing RLS policies with parent-vs-staff split
-- ------------------------------------------------------------

-- Ensure RLS is enabled (idempotent)
ALTER TABLE public.game_results ENABLE ROW LEVEL SECURITY;

-- Drop the existing policies by their REAL names (verified via pg_policy)
DROP POLICY IF EXISTS "game_results_read" ON public.game_results;
DROP POLICY IF EXISTS "game_results_write" ON public.game_results;

-- Also drop any policies from prior migration attempts, if present
DROP POLICY IF EXISTS "game_results_select_parent" ON public.game_results;
DROP POLICY IF EXISTS "game_results_select_staff" ON public.game_results;
DROP POLICY IF EXISTS "game_results_write_staff" ON public.game_results;

-- Parent SELECT: only published rows, only for their children's teams
CREATE POLICY "game_results_select_parent" ON public.game_results
  FOR SELECT
  TO authenticated
  USING (
    published_at IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.events e
      JOIN public.team_players tp ON tp.team_id = e.team_id
      JOIN public.player_guardians pg ON pg.player_id = tp.player_id
      JOIN public.guardians g ON g.id = pg.guardian_id
      WHERE e.id = game_results.event_id
        AND g.user_id = auth.uid()
    )
  );

-- Staff SELECT: all rows (draft + published) in their organization
CREATE POLICY "game_results_select_staff" ON public.game_results
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.user_roles ur
      JOIN public.events e ON e.id = game_results.event_id
      JOIN public.teams t ON t.id = e.team_id
      WHERE ur.user_id = auth.uid()
        AND ur.organization_id = t.org_id
        AND ur.role IN ('admin', 'coach')
    )
  );

-- Staff write (INSERT/UPDATE/DELETE) in their organization
CREATE POLICY "game_results_write_staff" ON public.game_results
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.user_roles ur
      JOIN public.events e ON e.id = game_results.event_id
      JOIN public.teams t ON t.id = e.team_id
      WHERE ur.user_id = auth.uid()
        AND ur.organization_id = t.org_id
        AND ur.role IN ('admin', 'coach')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.user_roles ur
      JOIN public.events e ON e.id = game_results.event_id
      JOIN public.teams t ON t.id = e.team_id
      WHERE ur.user_id = auth.uid()
        AND ur.organization_id = t.org_id
        AND ur.role IN ('admin', 'coach')
    )
  );

-- ------------------------------------------------------------
-- 4. Reload PostgREST schema cache
-- ------------------------------------------------------------
NOTIFY pgrst, 'reload schema';

COMMIT;

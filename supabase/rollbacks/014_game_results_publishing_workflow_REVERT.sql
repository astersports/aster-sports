-- ============================================================
-- 014_game_results_publishing_workflow_REVERT.sql
--
-- Rollback for Migration 014. Run ONLY if Migration 014 causes
-- parent or coach visibility regression in production.
--
-- This REVERT:
--   1. Drops the 3 new split policies (select_parent, select_staff, write_staff)
--   2. Drops the 3 new columns (published_at, published_by, private_notes)
--   3. Drops the partial index
--   4. Restores the original game_results_read and game_results_write policies
--      verbatim from pg_policy capture taken April 23, 2026
--
-- Do NOT apply unless Migration 014 is broken. Reverting leaves the
-- system in its pre-014 state where parents can read all game_results
-- rows in their org (the privacy hole Migration 014 closed). If revert
-- is needed, fix the broken policy logic in a new 014-bis migration
-- promptly rather than leaving the system unpatched long term.
--
-- WARNING: DROP COLUMN destroys any draft/published metadata written
-- between Migration 014 apply and this revert. Capture the data first
-- with: SELECT * FROM public.game_results;
--
-- Safe to re-apply: idempotent.
-- ============================================================

BEGIN;

-- 1. Drop new split policies
DROP POLICY IF EXISTS "game_results_select_parent" ON public.game_results;
DROP POLICY IF EXISTS "game_results_select_staff" ON public.game_results;
DROP POLICY IF EXISTS "game_results_write_staff" ON public.game_results;

-- 2. Drop partial index (auto-drops with columns but explicit for clarity)
DROP INDEX IF EXISTS public.idx_game_results_published_at;

-- 3. Drop new columns
ALTER TABLE public.game_results
  DROP COLUMN IF EXISTS published_at,
  DROP COLUMN IF EXISTS published_by,
  DROP COLUMN IF EXISTS private_notes;

-- 4. Restore original policies (verbatim from pg_policy capture April 23, 2026)
CREATE POLICY "game_results_read" ON public.game_results
  FOR SELECT
  USING (
    event_id IN (
      SELECT events.id
      FROM events
      WHERE events.team_id IN (
        SELECT teams.id
        FROM teams
        WHERE teams.org_id IN (
          SELECT user_roles.organization_id
          FROM user_roles
          WHERE user_roles.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "game_results_write" ON public.game_results
  FOR ALL
  USING (
    event_id IN (
      SELECT events.id
      FROM events
      WHERE events.team_id IN (
        SELECT teams.id
        FROM teams
        WHERE teams.org_id IN (
          SELECT user_roles.organization_id
          FROM user_roles
          WHERE user_roles.user_id = auth.uid()
            AND user_roles.role = ANY(ARRAY['admin'::text, 'coach'::text])
        )
      )
    )
  );

-- 5. Reload PostgREST cache
NOTIFY pgrst, 'reload schema';

COMMIT;

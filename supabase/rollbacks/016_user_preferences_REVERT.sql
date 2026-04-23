-- ============================================================
-- 016_user_preferences_REVERT.sql
--
-- Rollback for Migration 016. Run ONLY if Migration 016 causes
-- production regression. WARNING: destroys all user preferences
-- data.
--
-- This REVERT:
--   1. Drops the user_preferences table (DESTROYS all preferences)
--   2. Drops the auto-create trigger on user_roles
--   3. Drops the SECURITY DEFINER function
--   4. Reverts user_roles.organization_id to nullable
--
-- Note: dropping the table cascades to drop all policies, indexes,
-- CHECK constraints, and the updated_at trigger and function
-- associated with user_preferences.
--
-- WARNING: Before running this, capture preferences data:
--   SELECT * FROM public.user_preferences;
-- If the table was in active use, revert will lose user settings.
--
-- Safe to re-apply: idempotent.
-- ============================================================

BEGIN;

-- 1. Drop trigger and function on user_roles (the source side)
DROP TRIGGER IF EXISTS trg_user_roles_create_preferences ON public.user_roles;
DROP FUNCTION IF EXISTS public.user_roles_create_preferences();

-- 2. Drop the user_preferences table (cascades to policies, indexes,
--    CHECK constraints, updated_at trigger, updated_at function)
DROP TABLE IF EXISTS public.user_preferences CASCADE;

-- 3. Drop the updated_at function (not auto-dropped since it's standalone)
DROP FUNCTION IF EXISTS public.user_preferences_set_updated_at();

-- 4. Revert user_roles.organization_id to nullable
ALTER TABLE public.user_roles
  ALTER COLUMN organization_id DROP NOT NULL;

-- 5. Reload PostgREST cache
NOTIFY pgrst, 'reload schema';

COMMIT;

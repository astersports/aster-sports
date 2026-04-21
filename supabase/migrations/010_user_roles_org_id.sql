-- ============================================================
-- 010_user_roles_org_id.sql
--
-- Retrospective: captures organization_id column on user_roles.
-- Added to production via Supabase SQL Editor post-001_user_roles.sql.
-- Required by RLS policies in 011_tournaments.sql (tournaments_read etc.)
-- and by current_user_org_id() helper function.
-- Safe to re-apply: idempotent.
--
-- Note: user_roles has UNIQUE (user_id) today. Multi-org support will
-- require changing this to UNIQUE (user_id, organization_id) in a
-- future migration.
-- ============================================================

BEGIN;

ALTER TABLE public.user_roles
  ADD COLUMN IF NOT EXISTS organization_id uuid;

ALTER TABLE public.user_roles
  DROP CONSTRAINT IF EXISTS user_roles_organization_id_fkey;

ALTER TABLE public.user_roles
  ADD CONSTRAINT user_roles_organization_id_fkey
  FOREIGN KEY (organization_id)
  REFERENCES public.organizations(id)
  ON DELETE CASCADE;

NOTIFY pgrst, 'reload schema';

COMMIT;

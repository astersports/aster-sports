-- Wave: tighten user_roles_self policy to prevent privilege escalation
-- Applied: 2026-05-05 16:15:40 UTC via Supabase MCP apply_migration
-- Project: vrwwpsbfbnveawqwbdmj (Legacy Hoopers / Ember / Ember)
--
-- Previously: single cmd=ALL policy with NULL with_check allowed any
-- authenticated user to INSERT user_roles rows with any role (including 'admin').
-- Fix: split into SELECT (read own) + INSERT (only role='parent').
-- Admin/coach assignments require service_role (edge function).

DROP POLICY IF EXISTS user_roles_self ON public.user_roles;

CREATE POLICY user_roles_self_select ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY user_roles_self_insert ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND role = 'parent'
  );

-- Verification: confirm no UPDATE/DELETE policies (denies for authenticated)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='user_roles' AND cmd IN ('UPDATE','DELETE'))
  THEN RAISE EXCEPTION 'user_roles should not allow UPDATE/DELETE for authenticated';
  END IF;
  IF (SELECT COUNT(*) FROM pg_policies WHERE schemaname='public' AND tablename='user_roles') <> 2
  THEN RAISE EXCEPTION 'Expected exactly 2 policies on user_roles, got %',
    (SELECT COUNT(*) FROM pg_policies WHERE schemaname='public' AND tablename='user_roles');
  END IF;
END $$;

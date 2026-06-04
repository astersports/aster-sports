-- Track-R R-4 gated boundary: role-scope comms_messages + comms_message_recipients
-- reads, and split the FOR ALL write policies into per-command policies so SELECT
-- is governed solely by the read policies. Closes the parent cross-account read
-- (recipients 45 -> 0 for a parent) and the coach org-wide read (the FOR ALL write
-- policy was also granting SELECT). All refs schema-qualified (no search_path
-- dependency). Applied to production via apply_migration 2026-06-04; this mirror
-- is the repo parity copy (AP#21).
--
-- Live SET-LOCAL-ROLE enforcement proof (against the applied policies):
--   admin 17157/45 · coach 17065/0 · parent 0/0 · parent_synth 1/1 · anon 0/0
--   (msgs/recips). Coach + parent were 17157/45 each BEFORE (org-wide).
--
-- Helpers carry the standard authenticated_security_definer_function_executable
-- INFO advisory (lint 0029), same as all 11 existing current_user_* helpers. No
-- auth_rls_initplan advisory; comms_messages multiple_permissive overlap reduced.

-- ===== helpers (SECURITY DEFINER, recursion-safe; AP#23/#57 grant hygiene) =====
CREATE OR REPLACE FUNCTION public.current_user_admin_org_ids()
RETURNS uuid[] LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(ARRAY_AGG(DISTINCT organization_id), ARRAY[]::uuid[])
  FROM public.user_roles WHERE user_id = (SELECT auth.uid()) AND role = 'admin';
$$;
REVOKE EXECUTE ON FUNCTION public.current_user_admin_org_ids() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.current_user_admin_org_ids() FROM anon;
GRANT  EXECUTE ON FUNCTION public.current_user_admin_org_ids() TO authenticated;

CREATE OR REPLACE FUNCTION public.current_user_recipient_message_ids()
RETURNS uuid[] LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(ARRAY_AGG(DISTINCT r.message_id), ARRAY[]::uuid[])
  FROM public.comms_message_recipients r
  JOIN public.guardians g ON g.id = r.guardian_id
  WHERE g.user_id = (SELECT auth.uid());
$$;
REVOKE EXECUTE ON FUNCTION public.current_user_recipient_message_ids() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.current_user_recipient_message_ids() FROM anon;
GRANT  EXECUTE ON FUNCTION public.current_user_recipient_message_ids() TO authenticated;

-- ===== comms_messages: org-wide read -> role-scoped read =====
DROP POLICY IF EXISTS comms_messages_read ON public.comms_messages;
CREATE POLICY comms_messages_read ON public.comms_messages FOR SELECT TO authenticated
  USING (org_id = ANY (public.current_user_admin_org_ids())
      OR team_id = ANY (public.current_user_staff_team_ids())
      OR id = ANY (public.current_user_recipient_message_ids()));

-- ===== comms_messages: FOR ALL write -> per-command (same predicate) =====
DROP POLICY IF EXISTS comms_messages_write ON public.comms_messages;
CREATE POLICY comms_messages_insert ON public.comms_messages FOR INSERT TO authenticated
  WITH CHECK (org_id IN (SELECT organization_id FROM public.user_roles WHERE user_id = (SELECT auth.uid()) AND role = ANY (ARRAY['admin','coach'])));
CREATE POLICY comms_messages_update ON public.comms_messages FOR UPDATE TO authenticated
  USING      (org_id IN (SELECT organization_id FROM public.user_roles WHERE user_id = (SELECT auth.uid()) AND role = ANY (ARRAY['admin','coach'])))
  WITH CHECK (org_id IN (SELECT organization_id FROM public.user_roles WHERE user_id = (SELECT auth.uid()) AND role = ANY (ARRAY['admin','coach'])));
CREATE POLICY comms_messages_delete ON public.comms_messages FOR DELETE TO authenticated
  USING      (org_id IN (SELECT organization_id FROM public.user_roles WHERE user_id = (SELECT auth.uid()) AND role = ANY (ARRAY['admin','coach'])));

-- ===== comms_message_recipients: org-wide read -> admin-only read =====
-- parent_select_own_recipients (guardian-scoped) is left untouched and becomes
-- the parent's only SELECT path.
DROP POLICY IF EXISTS cmr_read ON public.comms_message_recipients;
CREATE POLICY cmr_read ON public.comms_message_recipients FOR SELECT TO authenticated
  USING (message_id IN (SELECT id FROM public.comms_messages WHERE org_id = ANY (public.current_user_admin_org_ids())));

-- ===== comms_message_recipients: FOR ALL write -> per-command (same predicate) =====
DROP POLICY IF EXISTS cmr_write ON public.comms_message_recipients;
CREATE POLICY cmr_insert ON public.comms_message_recipients FOR INSERT TO authenticated
  WITH CHECK (message_id IN (SELECT id FROM public.comms_messages WHERE org_id IN (SELECT organization_id FROM public.user_roles WHERE user_id = (SELECT auth.uid()) AND role = ANY (ARRAY['admin','coach']))));
CREATE POLICY cmr_update ON public.comms_message_recipients FOR UPDATE TO authenticated
  USING      (message_id IN (SELECT id FROM public.comms_messages WHERE org_id IN (SELECT organization_id FROM public.user_roles WHERE user_id = (SELECT auth.uid()) AND role = ANY (ARRAY['admin','coach']))))
  WITH CHECK (message_id IN (SELECT id FROM public.comms_messages WHERE org_id IN (SELECT organization_id FROM public.user_roles WHERE user_id = (SELECT auth.uid()) AND role = ANY (ARRAY['admin','coach']))));
CREATE POLICY cmr_delete ON public.comms_message_recipients FOR DELETE TO authenticated
  USING      (message_id IN (SELECT id FROM public.comms_messages WHERE org_id IN (SELECT organization_id FROM public.user_roles WHERE user_id = (SELECT auth.uid()) AND role = ANY (ARRAY['admin','coach']))));

-- ============================================================================
-- DOWN (manual reverse — restores the exact pre-migration org-wide policies,
-- captured verbatim from pg_policies before apply. Not auto-run by Supabase.)
-- ============================================================================
-- DROP POLICY IF EXISTS comms_messages_read   ON public.comms_messages;
-- DROP POLICY IF EXISTS comms_messages_insert ON public.comms_messages;
-- DROP POLICY IF EXISTS comms_messages_update ON public.comms_messages;
-- DROP POLICY IF EXISTS comms_messages_delete ON public.comms_messages;
-- CREATE POLICY comms_messages_read ON public.comms_messages FOR SELECT TO authenticated
--   USING (org_id IN (SELECT user_roles.organization_id FROM public.user_roles
--          WHERE user_roles.user_id = (SELECT auth.uid())));
-- CREATE POLICY comms_messages_write ON public.comms_messages FOR ALL TO authenticated
--   USING      (org_id IN (SELECT user_roles.organization_id FROM public.user_roles
--               WHERE user_roles.user_id = (SELECT auth.uid()) AND user_roles.role = ANY (ARRAY['admin'::text,'coach'::text])))
--   WITH CHECK (org_id IN (SELECT user_roles.organization_id FROM public.user_roles
--               WHERE user_roles.user_id = (SELECT auth.uid()) AND user_roles.role = ANY (ARRAY['admin'::text,'coach'::text])));
--
-- DROP POLICY IF EXISTS cmr_read   ON public.comms_message_recipients;
-- DROP POLICY IF EXISTS cmr_insert ON public.comms_message_recipients;
-- DROP POLICY IF EXISTS cmr_update ON public.comms_message_recipients;
-- DROP POLICY IF EXISTS cmr_delete ON public.comms_message_recipients;
-- CREATE POLICY cmr_read ON public.comms_message_recipients FOR SELECT TO authenticated
--   USING (message_id IN (SELECT comms_messages.id FROM public.comms_messages
--          WHERE comms_messages.org_id IN (SELECT user_roles.organization_id FROM public.user_roles
--                WHERE user_roles.user_id = (SELECT auth.uid()))));
-- CREATE POLICY cmr_write ON public.comms_message_recipients FOR ALL TO authenticated
--   USING      (message_id IN (SELECT comms_messages.id FROM public.comms_messages
--               WHERE comms_messages.org_id IN (SELECT user_roles.organization_id FROM public.user_roles
--                     WHERE user_roles.user_id = (SELECT auth.uid()) AND user_roles.role = ANY (ARRAY['admin'::text,'coach'::text]))))
--   WITH CHECK (message_id IN (SELECT comms_messages.id FROM public.comms_messages
--               WHERE comms_messages.org_id IN (SELECT user_roles.organization_id FROM public.user_roles
--                     WHERE user_roles.user_id = (SELECT auth.uid()) AND user_roles.role = ANY (ARRAY['admin'::text,'coach'::text]))));
--
-- DROP FUNCTION IF EXISTS public.current_user_recipient_message_ids();
-- DROP FUNCTION IF EXISTS public.current_user_admin_org_ids();
-- (parent_select_own_recipients was never touched by the UP migration.)

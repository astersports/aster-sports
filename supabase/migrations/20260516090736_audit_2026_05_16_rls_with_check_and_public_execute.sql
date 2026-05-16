-- 2026-05-16 audit-day Phase 4 P0 + P1 batch
--
-- Phase 4 findings:
--   (1) 3 UPDATE policies lack WITH CHECK (anti-pattern #20):
--       - briefing_reminders."admins update own org reminders"
--       - briefing_templates.briefing_templates_update_admin
--       - team_types.team_types_update_admin
--     Without WITH CHECK, an admin updating a row could change org_id
--     to another org's UUID and the update succeeds because the USING
--     qual checks the OLD row only.
--
--   (2) 3 SECURITY DEFINER functions have EXECUTE for PUBLIC (anti-pattern #23):
--       - briefing_active_queue, log_pii_change, suppress_unsubscribed_recipients
--     PUBLIC inherits to anon/authenticated; revoke sequence is PUBLIC then anon.
--
-- All authenticated + service_role explicit grants are preserved (they survive
-- PUBLIC revoke because they're direct grants, not inherited).
-- suppress_unsubscribed_recipients is a TRIGGER function — no app caller; safe.

-- === (1) WITH CHECK on 3 UPDATE policies ===

ALTER POLICY "admins update own org reminders" ON public.briefing_reminders
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.organization_id = briefing_reminders.org_id
      AND ur.role = ANY (ARRAY['admin'::text, 'super_admin'::text])
  ));

ALTER POLICY briefing_templates_update_admin ON public.briefing_templates
  WITH CHECK (org_id IN (
    SELECT user_roles.organization_id
    FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = ANY (ARRAY['admin'::text, 'super_admin'::text])
  ));

ALTER POLICY team_types_update_admin ON public.team_types
  WITH CHECK (org_id IN (
    SELECT user_roles.organization_id
    FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = ANY (ARRAY['admin'::text, 'super_admin'::text])
  ));

-- === (2) REVOKE PUBLIC + anon EXECUTE on 3 SECURITY DEFINER functions ===
-- Per anti-pattern #23: PUBLIC first (because anon inherits from PUBLIC),
-- then anon explicitly. authenticated + service_role explicit grants persist.

REVOKE EXECUTE ON FUNCTION public.briefing_active_queue(uuid, text, uuid[], text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.briefing_active_queue(uuid, text, uuid[], text) FROM anon;

REVOKE EXECUTE ON FUNCTION public.log_pii_change(text, uuid, text, text, text, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.log_pii_change(text, uuid, text, text, text, uuid) FROM anon;

REVOKE EXECUTE ON FUNCTION public.suppress_unsubscribed_recipients() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.suppress_unsubscribed_recipients() FROM anon;

-- === Verification block ===
DO $$
DECLARE
  v_policy_count int;
  v_grant_count  int;
BEGIN
  -- All 3 UPDATE policies must now have WITH CHECK
  SELECT count(*) INTO v_policy_count
  FROM pg_policies
  WHERE (
    (tablename = 'briefing_reminders' AND policyname = 'admins update own org reminders') OR
    (tablename = 'briefing_templates' AND policyname = 'briefing_templates_update_admin') OR
    (tablename = 'team_types' AND policyname = 'team_types_update_admin')
  ) AND with_check IS NOT NULL;
  IF v_policy_count <> 3 THEN
    RAISE EXCEPTION 'Expected 3 policies with WITH CHECK, found %', v_policy_count;
  END IF;

  -- PUBLIC + anon must NOT have EXECUTE on the 3 functions
  SELECT count(*) INTO v_grant_count
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  LEFT JOIN aclexplode(p.proacl) ae ON true
  LEFT JOIN pg_roles r ON r.oid = ae.grantee
  WHERE p.proname IN ('briefing_active_queue', 'log_pii_change', 'suppress_unsubscribed_recipients')
    AND n.nspname = 'public'
    AND ae.privilege_type = 'EXECUTE'
    AND (r.rolname = 'anon' OR ae.grantee = 0);
  IF v_grant_count <> 0 THEN
    RAISE EXCEPTION 'Expected 0 PUBLIC/anon EXECUTE grants, found %', v_grant_count;
  END IF;

  RAISE NOTICE 'Audit 2026-05-16 RLS + EXECUTE hygiene: PASSED';
END $$;

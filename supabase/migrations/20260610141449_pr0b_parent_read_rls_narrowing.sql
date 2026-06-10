-- 20260610141449_pr0b_parent_read_rls_narrowing.sql
--
-- MIRROR (AP#21) of the migration applied via the GO-gated MCP lane on 2026-06-10
-- (version 20260610141449, registered in supabase_migrations.schema_migrations).
-- This file is the source-tree record of what is LIVE in production; it was NOT
-- re-applied from here.
--
-- PR-0b — parent-read RLS narrowing (Track B hard gate G1). Finalized per the
-- F-RLS-1 ruling (admin-only staff scope on registrations).
--
-- WHY: registrations_select + tryout_attendees_select were org-wide
-- (org_id = ANY(current_user_org_ids())) — a parent could read every family's
-- registrations and every tryout attendee's coach-private evaluation_note.
--
-- F-RLS-1 ruling: registrations_select_staff = ADMIN-ONLY (registrations carry
-- medical_notes / emergency contacts / custom_responses — intake/financial-level,
-- a higher boundary than the roster-level players split-policy). tryout_attendees
-- stays admin+coach (evaluation_note is the coaches' own tool); no parent policy
-- there fully closes the evaluation_note leak (the parent surface does not read
-- tryout_attendees). Writes were already admin-gated and are untouched.
--
-- In-prod enforcement replay (impersonated JWT, rollback-only) confirmed:
--   parent = 1 (own child only) · admin = 2 (org-wide) · coach = 0 on registrations.

-- registrations: org-wide SELECT -> parent-own + staff(admin-only)
DROP POLICY IF EXISTS registrations_select ON public.registrations;

CREATE POLICY registrations_select_parent ON public.registrations
  FOR SELECT TO authenticated
  USING (player_id = ANY (public.current_user_player_ids()));

CREATE POLICY registrations_select_staff ON public.registrations
  FOR SELECT TO authenticated
  USING (public.user_has_role_in_org(org_id, ARRAY['admin']));

-- tryout_attendees: org-wide SELECT -> staff-only (admin+coach), no parent policy
DROP POLICY IF EXISTS tryout_attendees_select ON public.tryout_attendees;

CREATE POLICY tryout_attendees_select_staff ON public.tryout_attendees
  FOR SELECT TO authenticated
  USING (public.user_has_role_in_org(org_id, ARRAY['admin', 'coach']));

-- verify: the two org-wide SELECT policies are gone and the three new ones exist
DO $$
DECLARE
  v_old int;
  v_new int;
BEGIN
  SELECT count(*) INTO v_old FROM pg_policy
   WHERE polname IN ('registrations_select', 'tryout_attendees_select');
  IF v_old <> 0 THEN
    RAISE EXCEPTION 'pr0b verify: % org-wide SELECT policy(ies) still present', v_old;
  END IF;

  SELECT count(*) INTO v_new FROM pg_policy
   WHERE polname IN ('registrations_select_parent', 'registrations_select_staff',
                     'tryout_attendees_select_staff');
  IF v_new <> 3 THEN
    RAISE EXCEPTION 'pr0b verify: expected 3 new SELECT policies, found %', v_new;
  END IF;
END $$;

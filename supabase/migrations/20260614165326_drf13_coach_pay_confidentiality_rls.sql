-- DR-F13: pay confidentiality. Coach rate (coaching_assignments.pay_per_session_cents,
-- rates) + per-session pay (event_coach_assignments.pay_cents) are readable only by
-- admins and the OWNING coach — parents and co-staff coaches never. Closes the two live
-- leaks the audit reproduced (parent reads all rates; a coach reads co-staff pay_cents).
-- Non-pay coach names move to staff_profiles (useDriverNames repoint, same PR).
-- Applied via Supabase MCP 2026-06-14. Mirror of production version 20260614165326.

-- coaching_assignments: was any-org-member SELECT (leaked rate to parents). Now admin or owner.
DROP POLICY coaching_assignments_read ON public.coaching_assignments;
CREATE POLICY coaching_assignments_read ON public.coaching_assignments FOR SELECT
  USING (user_id = (SELECT auth.uid()) OR user_has_role_in_org(org_id, ARRAY['admin']));

-- event_coach_assignments: was self OR team_staff (the team_staff branch leaked co-staff
-- pay_cents). Now self-only; admins keep full read via the existing ALL policy
-- "admins manage own-org event coach assignments".
DROP POLICY "coaches read relevant event coach assignments" ON public.event_coach_assignments;
CREATE POLICY eca_read_self ON public.event_coach_assignments FOR SELECT
  USING (coach_user_id = (SELECT auth.uid()));

DO $v$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename='coaching_assignments' AND policyname='coaching_assignments_read'
              AND qual LIKE '%user_roles%' AND qual NOT LIKE '%user_has_role_in_org%' AND qual NOT LIKE '%auth.uid%') THEN
    RAISE EXCEPTION 'verify: coaching_assignments_read still broad';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename='event_coach_assignments' AND policyname LIKE '%relevant%') THEN
    RAISE EXCEPTION 'verify: old team_staff eca read policy still present';
  END IF;
END $v$;

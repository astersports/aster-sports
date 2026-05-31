-- Migration #12 (EMBER_PROGRAM_SETUP_SPEC_v2 §4.5 step 12 / §4.3): current_user_org_ids() +
-- parent SELECT policies. THE LAST §4.5 migration. Closes audit Finding A (the singular-org
-- current_user_org_id() LIMIT-1 assumption) at the RLS layer.
--
-- Part 1: current_user_org_ids() (plural) — returns ALL org_ids the user has a role in. Mirrors the
-- existing current_user_* helper shape (SQL, STABLE, SECURITY DEFINER, search_path=public). For a
-- single-org user (every user today) it returns an array of 1, so swapping singular→plural is
-- behavior-identical now and correct for the multi-org future. user_roles is already multi-org
-- capable (UNIQUE(user_id, organization_id), migration #0).
--
-- Part 2: swap the 8 new-table SELECT policies from `org_id = current_user_org_id()` (singular) to
-- `org_id = ANY(current_user_org_ids())` (plural) per spec §4.3 ("downstream tables use
-- org_id = ANY(current_user_org_ids()) for parent SELECT"). One unified policy covers admin (array
-- of 1) and multi-org parent (array of N).
--
-- *** AUTHORIZED DEVIATION FROM §16.7 PRIVACY LOCKS (Frank GO 2026-05-31, explicit) ***
-- This applies org-wide read to the 4 PII-bearing tables too — registrations, registration_fees,
-- tryout_attendees, player_equipment carry medical_notes, emergency/secondary contacts, and
-- custom_responses. Under this policy ANY authenticated parent in the org can read EVERY family's
-- registration PII. CC recommended child-scoped parent reads (via current_user_player_ids(), per
-- §11.5 + §16.7); Frank chose the literal spec §4.3 org-wide read. NOT exploitable today (no
-- parent-facing UI queries these tables), so this is a contract-only change with NO live exposure
-- until the registration UI ships. REVERT PATH (per PII table, before parent UI goes live): replace
-- the org-wide USING with a child-scoped OR:
--   USING (
--     user_has_role_in_org(org_id, ARRAY['admin'::text])           -- admin: org-wide
--     OR player_id = ANY (current_user_player_ids())               -- parent: own child only
--   )
-- (registration_fees/tryout_attendees join through registration_id→registrations.player_id;
--  player_equipment has player_id directly.) Reconsider before the parent registration surface ships.
-- Applied via Supabase MCP 2026-05-31 (version 20260531222056).

-- Part 1.
CREATE OR REPLACE FUNCTION public.current_user_org_ids()
RETURNS uuid[]
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COALESCE(ARRAY_AGG(DISTINCT organization_id), ARRAY[]::uuid[])
  FROM public.user_roles
  WHERE user_id = auth.uid();
$$;

REVOKE EXECUTE ON FUNCTION public.current_user_org_ids() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.current_user_org_ids() FROM anon;
GRANT  EXECUTE ON FUNCTION public.current_user_org_ids() TO authenticated, service_role;

-- Part 2: swap all 8 SELECT policies singular → plural.
DROP POLICY programs_select          ON public.programs;
CREATE POLICY programs_select          ON public.programs
  FOR SELECT TO authenticated USING (org_id = ANY (current_user_org_ids()));

DROP POLICY divisions_select         ON public.divisions;
CREATE POLICY divisions_select         ON public.divisions
  FOR SELECT TO authenticated USING (org_id = ANY (current_user_org_ids()));

DROP POLICY division_fees_select     ON public.division_fees;
CREATE POLICY division_fees_select     ON public.division_fees
  FOR SELECT TO authenticated USING (org_id = ANY (current_user_org_ids()));

DROP POLICY registrations_select     ON public.registrations;
CREATE POLICY registrations_select     ON public.registrations
  FOR SELECT TO authenticated USING (org_id = ANY (current_user_org_ids()));

DROP POLICY registration_fees_select ON public.registration_fees;
CREATE POLICY registration_fees_select ON public.registration_fees
  FOR SELECT TO authenticated USING (org_id = ANY (current_user_org_ids()));

DROP POLICY player_equipment_select  ON public.player_equipment;
CREATE POLICY player_equipment_select  ON public.player_equipment
  FOR SELECT TO authenticated USING (org_id = ANY (current_user_org_ids()));

DROP POLICY tryout_sessions_select   ON public.tryout_sessions;
CREATE POLICY tryout_sessions_select   ON public.tryout_sessions
  FOR SELECT TO authenticated USING (org_id = ANY (current_user_org_ids()));

DROP POLICY tryout_attendees_select  ON public.tryout_attendees;
CREATE POLICY tryout_attendees_select  ON public.tryout_attendees
  FOR SELECT TO authenticated USING (org_id = ANY (current_user_org_ids()));

-- Verify.
DO $$
DECLARE v_plural uuid[]; v_swapped int;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname='current_user_org_ids') THEN
    RAISE EXCEPTION 'verify failed: current_user_org_ids() not created';
  END IF;
  SELECT public.current_user_org_ids() INTO v_plural;
  IF v_plural IS NULL THEN
    RAISE EXCEPTION 'verify failed: current_user_org_ids() returned NULL (should be empty array)';
  END IF;
  SELECT count(*) INTO v_swapped FROM pg_policy
   WHERE polrelid::regclass::text IN ('programs','divisions','division_fees','registrations','registration_fees','player_equipment','tryout_sessions','tryout_attendees')
     AND polcmd='r' AND pg_get_expr(polqual, polrelid) ILIKE '%current_user_org_ids()%';
  IF v_swapped <> 8 THEN
    RAISE EXCEPTION 'verify failed: expected 8 select policies using current_user_org_ids(), got %', v_swapped;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policy WHERE polrelid::regclass::text IN ('programs','divisions','division_fees','registrations','registration_fees','player_equipment','tryout_sessions','tryout_attendees')
     AND polcmd='r' AND pg_get_expr(polqual, polrelid) ILIKE '%current_user_org_id()%' AND pg_get_expr(polqual, polrelid) NOT ILIKE '%current_user_org_ids()%') THEN
    RAISE EXCEPTION 'verify failed: a select policy still uses singular current_user_org_id()';
  END IF;
  RAISE NOTICE 'migration #12 verified: current_user_org_ids() created (locked to authenticated/service_role), 8 SELECT policies swapped singular->plural.';
END $$;

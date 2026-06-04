-- Briefings Phase 3 — D-6(a) parent inbox RLS policy.
--
-- Cross-reference: docs/REDESIGN_BRIEFINGS_2026-06-03.md §2.D-6,
-- §3.5 (policy shape) — minimal-viable parent inbox scope.
--
-- Adds a new PERMISSIVE SELECT policy on comms_message_recipients
-- scoped to "rows the requesting parent owns." Existing policies
-- (cmr_read for admin/coach via user_roles, cmr_write for the same)
-- are untouched.
--
-- Confirm-gated apply per Phase 2 doc + saved memory
-- autopilot-overreach-on-decisions-and-irreversible-ops. The FILE is
-- mirrored here (terminal-CC); the APPLY-to-prod step needs explicit
-- operator confirm + pre-flight EXPLAIN.
--
-- Pre-flight that the operator + chat-CC should run before apply:
--
--   SET ROLE authenticated;
--   SET request.jwt.claims = '{"sub":"<a real parent user_id>"}';
--   EXPLAIN (ANALYZE, BUFFERS)
--     SELECT id FROM public.comms_message_recipients
--      WHERE guardian_id IN (SELECT id FROM public.guardians WHERE user_id = auth.uid())
--      LIMIT 5;
--
-- Expected: Index Scan on the guardians(user_id) index; subselect
-- materialized once; comms_message_recipients(guardian_id) lookup
-- via the existing FK-supporting index.
--
-- Per AP #57: scoped to TO authenticated (not anon).
-- Per CLAUDE.md §5: auth.uid() wrapped in subselect.
-- Per Wave 3.B #29 doctrine context: policy is purpose-named + scoped.

CREATE POLICY parent_select_own_recipients
  ON public.comms_message_recipients
  FOR SELECT
  TO authenticated
  USING (
    guardian_id IN (
      SELECT id FROM public.guardians
      WHERE user_id = (SELECT auth.uid())
    )
  );

COMMENT ON POLICY parent_select_own_recipients ON public.comms_message_recipients IS
  'Phase 3 D-6(a) — parent inbox: parents see only their own recipient rows. Joined with existing cmr_read (admin/coach via user_roles); together they cover the SELECT surface. WRITE remains admin/coach-only via cmr_write.';

-- Verification: policy is registered.
do $$
begin
  if not exists (
    select 1 from pg_policies
     where schemaname = 'public'
       and tablename = 'comms_message_recipients'
       and policyname = 'parent_select_own_recipients'
  ) then
    raise exception 'parent_select_own_recipients policy missing after create';
  end if;
  raise notice 'D-6(a) parent inbox RLS policy registered';
end $$;

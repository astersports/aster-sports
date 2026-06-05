-- Briefings inbox read-state fix (audit P1).
--
-- Bug: comms_message_recipients had no parent UPDATE policy, so the
-- InboxDetail "mark opened" write (opened_at) was silently RLS-denied
-- for parents -> every briefing read "Unread" forever.
--
-- Fix: add a PERMISSIVE UPDATE policy scoped to the requesting parent's
-- OWN guardian rows. USING and WITH CHECK are both present (AP #20 --
-- a write policy must carry WITH CHECK). auth.uid() wrapped in a
-- subselect (§5 initplan rule). Scoped TO authenticated only (AP #57).
--
-- The existing admin/coach cmr_update policy is untouched; PERMISSIVE
-- policies OR together, so admin/coach keep their full write surface.
--
-- Column-level scoping: Postgres RLS cannot restrict columns, and the
-- table-level UPDATE grant to `authenticated` is load-bearing for the
-- admin/coach cmr_update path, so it cannot be downgraded without
-- breaking them. The WITH CHECK guarding the guardian scope is the
-- floor: a parent can only update rows they own AND cannot reassign a
-- row to a different guardian (the post-image guardian_id must still be
-- in their own set). This contains the parent write to their own
-- read-state rows.

CREATE POLICY parent_update_own_recipients
  ON public.comms_message_recipients
  FOR UPDATE
  TO authenticated
  USING (
    guardian_id IN (
      SELECT id FROM public.guardians
      WHERE user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    guardian_id IN (
      SELECT id FROM public.guardians
      WHERE user_id = (SELECT auth.uid())
    )
  );

COMMENT ON POLICY parent_update_own_recipients ON public.comms_message_recipients IS
  'Briefings inbox read-state -- parents may update their own recipient rows (opened_at mark-as-read). USING+WITH CHECK both scope to the caller''s guardian rows; WITH CHECK also prevents reassigning a row to another guardian. ORs with cmr_update (admin/coach). Audit P1 fix.';

do $$
begin
  if not exists (
    select 1 from pg_policies
     where schemaname='public' and tablename='comms_message_recipients'
       and policyname='parent_update_own_recipients'
  ) then
    raise exception 'parent_update_own_recipients policy missing after create';
  end if;
  raise notice 'parent_update_own_recipients policy registered';
end $$;

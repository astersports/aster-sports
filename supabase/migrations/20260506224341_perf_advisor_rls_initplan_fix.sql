-- ============================================================================
-- Wrap auth.uid() in subqueries on 4 RLS policies (perf advisor: auth_rls_initplan)
-- Date: 2026-05-06
-- ============================================================================
-- Wrapping auth.uid() as (SELECT auth.uid()) tells the planner to evaluate once
-- per query instead of once per row. No semantic change to access control;
-- preserving each policy's exact role scope, USING clause, and WITH CHECK clause.
-- ============================================================================

-- 1. event_comments.event_comments_write_own (role: public, cmd: ALL)
DROP POLICY IF EXISTS event_comments_write_own ON public.event_comments;
CREATE POLICY event_comments_write_own ON public.event_comments
  FOR ALL TO public
  USING       (event_org_matches(event_id) AND (author_user_id = (SELECT auth.uid())))
  WITH CHECK  (event_org_matches(event_id) AND (author_user_id = (SELECT auth.uid())));

-- 2. event_ride_requests.ride_requests_insert (role: authenticated, cmd: INSERT)
DROP POLICY IF EXISTS ride_requests_insert ON public.event_ride_requests;
CREATE POLICY ride_requests_insert ON public.event_ride_requests
  FOR INSERT TO authenticated
  WITH CHECK (
    (requester_user_id = (SELECT auth.uid()))
    AND (org_id = (SELECT current_user_org_id()))
  );

-- 3. event_ride_requests.ride_requests_update (role: authenticated, cmd: UPDATE)
DROP POLICY IF EXISTS ride_requests_update ON public.event_ride_requests;
CREATE POLICY ride_requests_update ON public.event_ride_requests
  FOR UPDATE TO authenticated
  USING (
    (requester_user_id = (SELECT auth.uid()))
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = (SELECT auth.uid())
        AND ur.organization_id = event_ride_requests.org_id
        AND ur.role = ANY (ARRAY['admin'::text, 'coach'::text])
    )
  )
  WITH CHECK (
    (requester_user_id = (SELECT auth.uid()))
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = (SELECT auth.uid())
        AND ur.organization_id = event_ride_requests.org_id
        AND ur.role = ANY (ARRAY['admin'::text, 'coach'::text])
    )
  );

-- 4. event_ride_requests.ride_requests_delete (role: authenticated, cmd: DELETE)
DROP POLICY IF EXISTS ride_requests_delete ON public.event_ride_requests;
CREATE POLICY ride_requests_delete ON public.event_ride_requests
  FOR DELETE TO authenticated
  USING (requester_user_id = (SELECT auth.uid()));

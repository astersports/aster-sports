-- ============================================================
-- 030_security_cleanup_REVERT.sql
--
-- Reverts Migration 030. Run ONLY for emergency rollback.
-- WARNING: Restores 5 P0 security holes (1 ERROR + 4 WARN RLS).
-- Function search_path locks are NOT reverted (no security risk to undoing).
-- ============================================================

BEGIN;

-- Restore SECURITY DEFINER on notifications_queue view
DROP VIEW IF EXISTS public.notifications_queue;
CREATE VIEW public.notifications_queue AS SELECT * FROM public.event_notifications;
COMMENT ON VIEW public.notifications_queue IS
  'DEPRECATED backward-compat view. Reverted to default SECURITY DEFINER state per rollback.';

-- Restore USING(true) RLS holes
CREATE POLICY "event_comments_public_insert" ON public.event_comments
  FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "event_duties_public_update" ON public.event_duties
  FOR UPDATE TO public USING (true) WITH CHECK (true);
CREATE POLICY "event_rsvps_public_insert" ON public.event_rsvps
  FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "event_rsvps_public_update" ON public.event_rsvps
  FOR UPDATE TO public USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';

COMMIT;

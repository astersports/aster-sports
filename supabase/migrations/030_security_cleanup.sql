-- ============================================================
-- 030_security_cleanup.sql
--
-- Status: APPLIED VIA MCP April 26 2026 (version 20260426021246)
-- Result: 23 of 24 advisor findings closed.
--   Remaining: 1 WARN (Leaked Password Protection - dashboard toggle).
--
-- Closes outstanding Supabase advisor security findings:
--   1 ERROR  notifications_queue view defined as SECURITY DEFINER
--   4 WARN   USING(true) RLS holes on event_comments + event_duties + event_rsvps
--  18 WARN   Functions missing SET search_path = public
--
-- All changes additive or replacement. No data destruction.
-- Verified function signatures via pg_proc query before writing.
-- Pre-flight check: no anonymous flows for RSVP/duty/comments confirmed by Frank.
--
-- Rollback: supabase/rollbacks/030_security_cleanup_REVERT.sql
-- ============================================================

BEGIN;

-- SECTION 1: Drop USING(true) RLS holes (P0 privacy fix)
DROP POLICY IF EXISTS "event_comments_public_insert" ON public.event_comments;
DROP POLICY IF EXISTS "event_duties_public_update" ON public.event_duties;
DROP POLICY IF EXISTS "event_rsvps_public_insert" ON public.event_rsvps;
DROP POLICY IF EXISTS "event_rsvps_public_update" ON public.event_rsvps;

-- SECTION 2: Recreate notifications_queue view with security_invoker
DROP VIEW IF EXISTS public.notifications_queue;

CREATE VIEW public.notifications_queue
WITH (security_invoker = true)
AS SELECT * FROM public.event_notifications;

COMMENT ON VIEW public.notifications_queue IS
  'DEPRECATED backward-compat view from Migration 019. Underlying table renamed to event_notifications. Frontend code should migrate references. SECURITY: recreated in Migration 030 with security_invoker = true to enforce caller RLS.';

-- SECTION 3: Lock down search_path on 18 functions
ALTER FUNCTION public.set_updated_at() SET search_path = public;
ALTER FUNCTION public.set_default_hotel_deadline() SET search_path = public;
ALTER FUNCTION public.prevent_message_body_edit() SET search_path = public;
ALTER FUNCTION public.user_preferences_set_updated_at() SET search_path = public;
ALTER FUNCTION public.team_achievements_set_updated_at() SET search_path = public;
ALTER FUNCTION public.trg_event_inserted() SET search_path = public;
ALTER FUNCTION public.trg_event_cancelled() SET search_path = public;
ALTER FUNCTION public.trg_event_rescheduled() SET search_path = public;
ALTER FUNCTION public.trg_event_relocated() SET search_path = public;
ALTER FUNCTION public.trg_event_comment_posted() SET search_path = public;
ALTER FUNCTION public.current_user_org_id() SET search_path = public;
ALTER FUNCTION public.event_org_matches(p_event_id uuid) SET search_path = public;
ALTER FUNCTION public.get_coach_rate_cents(p_assignment_id uuid, p_event_type text) SET search_path = public;
ALTER FUNCTION public.get_tournament_recipients(p_tournament_id uuid, p_team_id uuid) SET search_path = public;
ALTER FUNCTION public.get_tournament_rsvp_summary(p_tournament_id uuid, p_team_id uuid) SET search_path = public;
ALTER FUNCTION public.claim_ride_offer(p_offer_id uuid, p_for_child_id uuid, p_seats_requested integer, p_pickup_address text, p_pickup_notes text, p_return_needed boolean) SET search_path = public;
ALTER FUNCTION public.cancel_ride_claim(p_claim_id uuid, p_cancelled_by text) SET search_path = public;
ALTER FUNCTION public.notify_team_of_event_change(p_event_id uuid, p_team_id uuid, p_org_id uuid, p_notification_type text, p_change_summary jsonb, p_urgent boolean) SET search_path = public;

-- SECTION 4: Reload PostgREST cache
NOTIFY pgrst, 'reload schema';

COMMIT;

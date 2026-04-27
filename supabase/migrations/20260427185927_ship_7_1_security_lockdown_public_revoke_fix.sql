-- ============================================================
-- Ship 7.1 follow-up — fix PUBLIC-grant inheritance gap
-- Date: April 27, 2026
--
-- Defect in migration 20260427185842: REVOKE FROM anon does not block
-- anon when the function also has a PUBLIC grant, because anon inherits
-- from PUBLIC.
-- 
-- This migration revokes EXECUTE from PUBLIC for the client-facing RPCs
-- and RLS helpers in Groups B and C. Each function retains its explicit
-- authenticated grant (visible in pg_proc.proacl as authenticated=X/postgres),
-- so signed-in users continue to call them normally. Anon is fully blocked.
-- ============================================================

BEGIN;

-- Group B: RLS helpers
REVOKE EXECUTE ON FUNCTION public.current_user_org_id()                  FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.current_user_guardian_id()             FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.current_user_player_ids()              FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.current_user_child_team_ids()          FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.current_user_staff_team_ids()          FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.current_user_teammate_player_ids()     FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.user_has_role_in_org(uuid, text[])     FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.event_org_matches(uuid)                FROM PUBLIC;

-- Group C: client-facing action RPCs
REVOKE EXECUTE ON FUNCTION public.claim_ride_offer(uuid, uuid, integer, text, text, boolean)
  FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.cancel_ride_claim(uuid, text)
  FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_event_ride_state(uuid)
  FROM PUBLIC;

COMMIT;

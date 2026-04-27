-- ============================================================
-- Ship 7.1 — Security lockdown
-- Date: April 27, 2026
-- Audit basis: audit/AUDIT_SYNTHESIS_2026_04_27.md sections H3, H4, S1, S2
--
-- Closes:
--   B2 (P0 SEC) — 21 SECURITY DEFINER functions exposed to anon role.
--                 Anon can call /rest/v1/rpc/claim_ride_offer and similar
--                 to bypass RLS. Live in production.
--   B3 (P1 SEC) — ride_claims_insert RLS policy is admin-only. Parents
--                 work today only via SECURITY DEFINER RPC bypass. Brittle.
--
-- Strategy:
--   Group A (trigger functions, never called directly): REVOKE from PUBLIC,
--     anon, authenticated. Triggers fire as function owner regardless.
--   Group B (RLS helpers used by authenticated queries): REVOKE from anon only.
--   Group C (action RPCs called by client app): REVOKE from anon only.
--   Group D (internal helpers called by triggers only): REVOKE from PUBLIC,
--     anon, authenticated.
--
-- Reversibility: full DCL/policy operation, reversible by re-granting and
-- restoring original policy. service_role retains all access throughout.
--
-- KNOWN DEFECT (fixed in next migration 20260427185927):
--   Sections 3 + 4 only revoke from anon, but anon inherits from PUBLIC,
--   so the revokes were ineffective. Follow-up migration revokes PUBLIC.
-- ============================================================

BEGIN;

-- ----------------------------------------------------------------
-- SECTION 1: Trigger functions (Group A) — REVOKE from all client roles
-- ----------------------------------------------------------------
-- These functions are invoked only by PostgreSQL trigger machinery, never
-- by client SQL or PostgREST RPC. Triggers run with function owner's
-- privileges (SECURITY DEFINER), so the user firing the INSERT/UPDATE/
-- DELETE does NOT need EXECUTE permission on the trigger function.

REVOKE EXECUTE ON FUNCTION public.trg_event_cancelled()                  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trg_event_comment_posted()             FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trg_event_inserted()                   FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trg_event_relocated()                  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trg_event_rescheduled()                FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trg_ride_claim_status_change()         FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trg_ride_offer_cancelled_cascade()     FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.user_roles_create_preferences()        FROM PUBLIC, anon, authenticated;

-- ----------------------------------------------------------------
-- SECTION 2: Internal trigger helpers (Group D) — REVOKE from all client roles
-- ----------------------------------------------------------------
-- These are called only by other trigger functions, never by client code.

REVOKE EXECUTE ON FUNCTION public.promote_next_waitlist_claim(uuid)
  FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.notify_team_of_event_change(uuid, uuid, uuid, text, jsonb, boolean)
  FROM PUBLIC, anon, authenticated;

-- ----------------------------------------------------------------
-- SECTION 3: RLS helper functions (Group B) — REVOKE from anon only
-- ----------------------------------------------------------------
-- Used by authenticated user queries inside RLS policies. Anonymous
-- callers should not be able to invoke these directly via RPC.
-- Authenticated and service_role retain access.
-- NOTE: PUBLIC-grant cleanup happens in 20260427185927.

REVOKE EXECUTE ON FUNCTION public.current_user_org_id()                  FROM anon;
REVOKE EXECUTE ON FUNCTION public.current_user_guardian_id()             FROM anon;
REVOKE EXECUTE ON FUNCTION public.current_user_player_ids()              FROM anon;
REVOKE EXECUTE ON FUNCTION public.current_user_child_team_ids()          FROM anon;
REVOKE EXECUTE ON FUNCTION public.current_user_staff_team_ids()          FROM anon;
REVOKE EXECUTE ON FUNCTION public.current_user_teammate_player_ids()     FROM anon;
REVOKE EXECUTE ON FUNCTION public.user_has_role_in_org(uuid, text[])     FROM anon;
REVOKE EXECUTE ON FUNCTION public.event_org_matches(uuid)                FROM anon;

-- ----------------------------------------------------------------
-- SECTION 4: Client-facing action RPCs (Group C) — REVOKE from anon only
-- ----------------------------------------------------------------
-- Called by signed-in users via supabase.rpc(). Authenticated retains.
-- NOTE: PUBLIC-grant cleanup happens in 20260427185927.

REVOKE EXECUTE ON FUNCTION public.claim_ride_offer(uuid, uuid, integer, text, text, boolean)
  FROM anon;

REVOKE EXECUTE ON FUNCTION public.cancel_ride_claim(uuid, text)
  FROM anon;

REVOKE EXECUTE ON FUNCTION public.get_event_ride_state(uuid)
  FROM anon;

-- ----------------------------------------------------------------
-- SECTION 5: ride_claims_insert RLS — broaden to permit rider self-insert
-- ----------------------------------------------------------------
-- BEFORE: WITH CHECK user_has_role_in_org(org_id, ARRAY['admin'])
--   Parents only inserted via claim_ride_offer RPC bypass. Defense-in-depth
--   gap: any direct-insert path breaks parents silently.
--
-- AFTER: rider may insert their own claim against an active offer in
--   their own org, OR admin may insert anything. claim_ride_offer RPC
--   continues to work (still SECURITY DEFINER, bypasses RLS as before).

DROP POLICY IF EXISTS ride_claims_insert ON public.event_ride_claims;

CREATE POLICY ride_claims_insert ON public.event_ride_claims
  FOR INSERT
  WITH CHECK (
    -- Branch 1: rider self-insert
    (
      rider_user_id = (SELECT auth.uid())
      AND EXISTS (
        SELECT 1 FROM event_ride_offers o
        WHERE o.id = offer_id
          AND o.org_id = event_ride_claims.org_id
          AND o.status = 'active'
      )
      AND user_has_role_in_org(org_id, ARRAY['parent','coach','admin'])
    )
    -- Branch 2: admin override (preserves prior behavior)
    OR user_has_role_in_org(org_id, ARRAY['admin'])
  );

COMMIT;

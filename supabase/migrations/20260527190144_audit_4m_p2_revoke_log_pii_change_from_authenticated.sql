-- Audit §4.M P2 close (anti-pattern #57). log_pii_change is SECURITY
-- DEFINER and is only invoked from inside other SECURITY DEFINER RPCs
-- (e.g. the roster-lock RPCs PERFORM public.log_pii_change(...)), which
-- run as their definer/owner — not as the calling client. There is no
-- direct client caller (verified 2026-05-27: useEventRosterLock calls the
-- RPCs, never this function). Revoke the lingering authenticated EXECUTE
-- so it cannot be invoked directly by clients; the SECDEF-RPC path is
-- unaffected. PUBLIC was already revoked in mig 20260516090736.
REVOKE EXECUTE ON FUNCTION public.log_pii_change(text, uuid, text, text, text, uuid) FROM authenticated;

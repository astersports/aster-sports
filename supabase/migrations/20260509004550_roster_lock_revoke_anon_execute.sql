-- Defense-in-depth: revoke anon execute on roster lock RPCs.
-- Function bodies are already role-gated (raise exception if not coach/admin),
-- but explicit REVOKE FROM anon closes the API endpoint to unauthenticated calls.
-- Same fix applied to log_pii_change which has the same gap from foundation.

REVOKE EXECUTE ON FUNCTION public.lock_event_roster(uuid, uuid[]) FROM anon;
REVOKE EXECUTE ON FUNCTION public.unlock_event_roster(uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.add_academy_callup(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.remove_academy_callup(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.log_pii_change(text, uuid, text, text, text, uuid) FROM anon;

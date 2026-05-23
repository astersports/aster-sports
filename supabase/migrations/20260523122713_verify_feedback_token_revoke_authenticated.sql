-- Cutover PR 7a follow-up — defense-in-depth REVOKE.
--
-- get_advisors session-open (2026-05-22) flagged that authenticated has
-- EXECUTE on verify_feedback_token. Only the edge function
-- feedback-token-handler consumes this RPC, and it uses service_role
-- internally — authenticated should never reach it. Comparison: the
-- sibling apply_feedback_submission was correctly revoked in PR 7a;
-- verify slipped for the authenticated role specifically (PUBLIC + anon
-- were caught per CLAUDE.md AP #23 + #57).
--
-- service_role retains EXECUTE (granted separately to the role used by
-- the edge function admin client). No functional impact on the handler.

REVOKE EXECUTE ON FUNCTION public.verify_feedback_token(p_token text) FROM authenticated;

DO $$
DECLARE
  authenticated_has_execute boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.routine_privileges
    WHERE specific_schema = 'public'
      AND routine_name = 'verify_feedback_token'
      AND grantee = 'authenticated'
      AND privilege_type = 'EXECUTE'
  ) INTO authenticated_has_execute;
  IF authenticated_has_execute THEN
    RAISE EXCEPTION 'verify_feedback_token still has EXECUTE for authenticated post-REVOKE — Supabase default-privilege re-grant per AP #57?';
  END IF;
END;
$$;

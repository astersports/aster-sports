-- F-ONBOARDING (Tier-0) — SECDEF self-claim helper that links an anonymously-
-- created guardian row (from submit_registration) to a fresh auth.users account.
-- Closes P0-NEW-1 (onboarding pipeline severed: autoLinkGuardian is dead under
-- guardians_select_own/update_own RLS for an unlinked row). HARD email-confirmation
-- gate (v_confirmed IS NULL -> 'email_unconfirmed'); links only user_id IS NULL rows;
-- idempotent. Applied by the architect via MCP 2026-06-09; this is the AP#21 mirror
-- (exact CREATE OR REPLACE re-dumped via pg_get_functiondef). INERT until CC wires it
-- into resolveNewUserContext (B-PR2).
-- AP#57 NOTE: anon retains default EXECUTE on this function (REVOKE FROM PUBLIC does
-- not strip the Supabase anon default). Harmless (anon -> auth.uid() NULL ->
-- 'unauthenticated' no-op) but a follow-up `REVOKE EXECUTE ... FROM anon` is owed
-- per AP#23/#57 — tracked for the architect lane.
CREATE OR REPLACE FUNCTION public.claim_guardian_by_email()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth', 'pg_catalog'
AS $function$
DECLARE
  v_user_id   uuid := auth.uid();
  v_email     text;
  v_confirmed timestamptz;
  v_linked    int := 0;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('claimed', false, 'reason', 'unauthenticated');
  END IF;

  SELECT lower(email), email_confirmed_at
    INTO v_email, v_confirmed
    FROM auth.users
   WHERE id = v_user_id;

  IF v_email IS NULL THEN
    RETURN jsonb_build_object('claimed', false, 'reason', 'no_user_row');
  END IF;

  -- HARD GATE: only a confirmed email may claim a guardian row by email match.
  IF v_confirmed IS NULL THEN
    RETURN jsonb_build_object('claimed', false, 'reason', 'email_unconfirmed');
  END IF;

  UPDATE guardians
     SET user_id = v_user_id, updated_at = now()
   WHERE lower(email) = v_email
     AND user_id IS NULL;
  GET DIAGNOSTICS v_linked = ROW_COUNT;

  RETURN jsonb_build_object('claimed', v_linked > 0, 'linked_count', v_linked);
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.claim_guardian_by_email() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.claim_guardian_by_email() TO authenticated;

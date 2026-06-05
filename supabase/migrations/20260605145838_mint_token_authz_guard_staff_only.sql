-- Mint-token authorization guard (audit P1/P2 security fix).
--
-- Bug: public.mint_rsvp_token and public.mint_callup_token are
-- SECURITY DEFINER and granted to `authenticated` with NO relationship
-- check. Any logged-in parent could mint a signed token for ANOTHER
-- family and act on their behalf (RSVP / academy call-up response).
--
-- Fix: add an in-function authorization guard. The legitimate callers
-- are the rsvp_nudge / academy_callup send paths (src/lib/rsvpNudgeSend.js,
-- src/lib/academyCallupSend.js), which run client-side as the
-- authenticated admin/coach. The guard requires the caller to be an
-- admin or coach in the org that OWNS the event (events -> teams.org_id),
-- mirroring the org-scoped admin/coach shape of the cmr_update /
-- cmr_insert policies on comms_message_recipients.
--
-- service_role (trusted server/cron infra) is allowed through: it has
-- no `sub` claim so auth.uid() is null and a role-row check would always
-- fail, but service_role is fully trusted. auth.role() distinguishes it.
--
-- Bodies are otherwise byte-identical to the live definitions (verified
-- via pg_get_functiondef before this migration) -- only the guard block
-- is inserted, immediately after the response-validation IF.

CREATE OR REPLACE FUNCTION public.mint_rsvp_token(p_event_id uuid, p_player_id uuid, p_guardian_id uuid, p_response text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_secret text;
  v_nonce text;
  v_payload_json text;
  v_payload_b64 text;
  v_signature_b64 text;
BEGIN
  IF p_response NOT IN ('going','maybe','not_going') THEN
    RAISE EXCEPTION 'invalid response: %', p_response;
  END IF;
  -- Authorization guard (audit P1/P2): only staff (admin/coach of the
  -- event's org) or service_role may mint. Prevents a parent from
  -- minting a token for another family.
  IF auth.role() <> 'service_role' AND NOT EXISTS (
    SELECT 1
    FROM events e
    JOIN teams t ON t.id = e.team_id
    JOIN user_roles ur ON ur.organization_id = t.org_id
    WHERE e.id = p_event_id
      AND ur.user_id = (SELECT auth.uid())
      AND ur.role IN ('admin','coach')
  ) THEN
    RAISE EXCEPTION 'not authorized to mint token for this event';
  END IF;
  SELECT value INTO v_secret FROM app_secrets WHERE name = 'rsvp_token_secret';
  IF v_secret IS NULL OR v_secret = '' THEN
    RAISE EXCEPTION 'rsvp_token_secret not configured';
  END IF;
  v_nonce := encode(extensions.gen_random_bytes(16), 'hex');
  v_payload_json := jsonb_build_object(
    'e', p_event_id::text,
    'p', p_player_id::text,
    'g', p_guardian_id::text,
    'r', p_response,
    'n', v_nonce,
    'x', extract(epoch from (now() + interval '30 days'))::bigint
  )::text;
  v_payload_b64 := rtrim(replace(replace(replace(
    encode(v_payload_json::bytea, 'base64'),
    '+', '-'), '/', '_'), E'\n', ''), '=');
  v_signature_b64 := rtrim(replace(replace(replace(
    encode(extensions.hmac(v_payload_b64::bytea, v_secret::bytea, 'sha256'), 'base64'),
    '+', '-'), '/', '_'), E'\n', ''), '=');
  RETURN v_payload_b64 || '.' || v_signature_b64;
END;
$function$;

CREATE OR REPLACE FUNCTION public.mint_callup_token(p_event_id uuid, p_player_id uuid, p_guardian_id uuid, p_response text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_secret text;
  v_nonce text;
  v_payload_json text;
  v_payload_b64 text;
  v_signature_b64 text;
BEGIN
  IF p_response NOT IN ('accept','decline') THEN
    RAISE EXCEPTION 'invalid response: %', p_response;
  END IF;
  -- Authorization guard (audit P1/P2): only staff (admin/coach of the
  -- event's org) or service_role may mint. Prevents a parent from
  -- minting a token for another family.
  IF auth.role() <> 'service_role' AND NOT EXISTS (
    SELECT 1
    FROM events e
    JOIN teams t ON t.id = e.team_id
    JOIN user_roles ur ON ur.organization_id = t.org_id
    WHERE e.id = p_event_id
      AND ur.user_id = (SELECT auth.uid())
      AND ur.role IN ('admin','coach')
  ) THEN
    RAISE EXCEPTION 'not authorized to mint token for this event';
  END IF;
  SELECT value INTO v_secret FROM app_secrets WHERE name = 'callup_token_secret';
  IF v_secret IS NULL OR v_secret = '' THEN
    RAISE EXCEPTION 'callup_token_secret not configured';
  END IF;
  v_nonce := encode(extensions.gen_random_bytes(16), 'hex');
  v_payload_json := jsonb_build_object(
    'e', p_event_id::text,
    'p', p_player_id::text,
    'g', p_guardian_id::text,
    'r', p_response,
    'n', v_nonce,
    'x', extract(epoch from (now() + interval '30 days'))::bigint
  )::text;
  v_payload_b64 := rtrim(replace(replace(replace(
    encode(v_payload_json::bytea, 'base64'),
    '+', '-'), '/', '_'), E'\n', ''), '=');
  v_signature_b64 := rtrim(replace(replace(replace(
    encode(extensions.hmac(v_payload_b64::bytea, v_secret::bytea, 'sha256'), 'base64'),
    '+', '-'), '/', '_'), E'\n', ''), '=');
  RETURN v_payload_b64 || '.' || v_signature_b64;
END;
$function$;

-- Grants unchanged (authenticated, service_role); authz now enforced in-body.
REVOKE ALL ON FUNCTION public.mint_rsvp_token(uuid,uuid,uuid,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.mint_rsvp_token(uuid,uuid,uuid,text) FROM anon;
GRANT EXECUTE ON FUNCTION public.mint_rsvp_token(uuid,uuid,uuid,text) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.mint_callup_token(uuid,uuid,uuid,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.mint_callup_token(uuid,uuid,uuid,text) FROM anon;
GRANT EXECUTE ON FUNCTION public.mint_callup_token(uuid,uuid,uuid,text) TO authenticated, service_role;

-- L99 wave 4.1+4.2 foundation step M8: HMAC-signed unsubscribe tokens
-- Pattern matches mint_rsvp_token / verify_rsvp_token from wave 4.0.
-- Token shape: base64url(guardian_id:issued_at).base64url(hmac_sha256(payload, secret))
-- No expiry: unsubscribe links must work indefinitely (CAN-SPAM expectation).

CREATE OR REPLACE FUNCTION public.mint_unsubscribe_token(p_guardian_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_secret text;
  v_payload text;
  v_payload_b64 text;
  v_signature_b64 text;
BEGIN
  v_secret := current_setting('app.settings.unsubscribe_secret', true);
  IF v_secret IS NULL OR v_secret = '' THEN
    RAISE EXCEPTION 'unsubscribe_secret GUC not set';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM guardians WHERE id = p_guardian_id) THEN
    RAISE EXCEPTION 'unknown guardian: %', p_guardian_id;
  END IF;

  v_payload := p_guardian_id::text || ':' || extract(epoch from now())::bigint::text;

  v_payload_b64 := rtrim(translate(
    encode(v_payload::bytea, 'base64'), '+/=', '-_'), E'\n');

  v_signature_b64 := rtrim(translate(
    encode(extensions.hmac(v_payload_b64::bytea, v_secret::bytea, 'sha256'), 'base64'),
    '+/=', '-_'), E'\n');

  RETURN v_payload_b64 || '.' || v_signature_b64;
END;
$$;

REVOKE ALL ON FUNCTION public.mint_unsubscribe_token FROM public;
GRANT EXECUTE ON FUNCTION public.mint_unsubscribe_token TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.verify_unsubscribe_token(p_token text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_secret text;
  v_dot_idx int;
  v_payload_b64 text;
  v_signature_b64 text;
  v_expected_sig text;
  v_payload text;
  v_parts text[];
BEGIN
  v_secret := current_setting('app.settings.unsubscribe_secret', true);
  IF v_secret IS NULL OR v_secret = '' THEN RETURN NULL; END IF;

  v_dot_idx := position('.' in p_token);
  IF v_dot_idx = 0 THEN RETURN NULL; END IF;

  v_payload_b64 := substring(p_token, 1, v_dot_idx - 1);
  v_signature_b64 := substring(p_token, v_dot_idx + 1);

  v_expected_sig := rtrim(translate(
    encode(extensions.hmac(v_payload_b64::bytea, v_secret::bytea, 'sha256'), 'base64'),
    '+/=', '-_'), E'\n');

  IF v_expected_sig != v_signature_b64 THEN RETURN NULL; END IF;

  BEGIN
    v_payload := convert_from(
      decode(translate(v_payload_b64, '-_', '+/') ||
             repeat('=', (4 - length(v_payload_b64) % 4) % 4), 'base64'),
      'UTF8'
    );
  EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
  END;

  v_parts := string_to_array(v_payload, ':');
  IF array_length(v_parts, 1) != 2 THEN RETURN NULL; END IF;

  RETURN v_parts[1]::uuid;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.verify_unsubscribe_token FROM public;
GRANT EXECUTE ON FUNCTION public.verify_unsubscribe_token TO service_role;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.routines
    WHERE routine_schema='public'
      AND routine_name IN ('mint_unsubscribe_token', 'verify_unsubscribe_token')
    HAVING COUNT(*) = 2
  ) THEN
    RAISE EXCEPTION 'unsubscribe token functions not both registered';
  END IF;
END $$;

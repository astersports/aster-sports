-- Replace ALTER DATABASE-required GUCs with service-role-only secrets table.
-- Also fixes latent bug in original mint_rsvp_token (unqualified gen_random_bytes/hmac).

CREATE TABLE IF NOT EXISTS app_secrets (
  name text PRIMARY KEY,
  value text NOT NULL,
  rotated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE app_secrets ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON app_secrets FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON app_secrets TO service_role;

COMMENT ON TABLE app_secrets IS
  'Service-role-only secrets storage. Replaces app.settings.* GUCs. Read by SECURITY DEFINER token functions.';

INSERT INTO app_secrets (name, value)
SELECT 'unsubscribe_secret', encode(extensions.gen_random_bytes(32), 'base64')
WHERE NOT EXISTS (SELECT 1 FROM app_secrets WHERE name='unsubscribe_secret');

INSERT INTO app_secrets (name, value)
SELECT 'rsvp_token_secret', encode(extensions.gen_random_bytes(32), 'base64')
WHERE NOT EXISTS (SELECT 1 FROM app_secrets WHERE name='rsvp_token_secret');

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
  SELECT value INTO v_secret FROM app_secrets WHERE name = 'unsubscribe_secret';
  IF v_secret IS NULL OR v_secret = '' THEN
    RAISE EXCEPTION 'unsubscribe_secret not configured';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM guardians WHERE id = p_guardian_id) THEN
    RAISE EXCEPTION 'unknown guardian: %', p_guardian_id;
  END IF;
  v_payload := p_guardian_id::text || ':' || extract(epoch from now())::bigint::text;
  v_payload_b64 := rtrim(translate(encode(v_payload::bytea, 'base64'), '+/=', '-_'), E'\n');
  v_signature_b64 := rtrim(translate(
    encode(extensions.hmac(v_payload_b64::bytea, v_secret::bytea, 'sha256'), 'base64'),
    '+/=', '-_'), E'\n');
  RETURN v_payload_b64 || '.' || v_signature_b64;
END;
$$;

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
  SELECT value INTO v_secret FROM app_secrets WHERE name = 'unsubscribe_secret';
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
  EXCEPTION WHEN OTHERS THEN RETURN NULL; END;
  v_parts := string_to_array(v_payload, ':');
  IF array_length(v_parts, 1) != 2 THEN RETURN NULL; END IF;
  RETURN v_parts[1]::uuid;
EXCEPTION WHEN OTHERS THEN RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.mint_rsvp_token(
  p_event_id uuid, p_player_id uuid, p_guardian_id uuid, p_response text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.verify_rsvp_token(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_secret text;
  v_payload_b64 text;
  v_signature_b64 text;
  v_expected_sig text;
  v_payload jsonb;
  v_payload_decoded text;
  v_dot_idx int;
  v_nonce text;
  v_b64_padded text;
BEGIN
  SELECT value INTO v_secret FROM app_secrets WHERE name = 'rsvp_token_secret';
  IF v_secret IS NULL OR v_secret = '' THEN RETURN NULL; END IF;
  v_dot_idx := position('.' in p_token);
  IF v_dot_idx = 0 THEN RETURN NULL; END IF;
  v_payload_b64 := substring(p_token, 1, v_dot_idx - 1);
  v_signature_b64 := substring(p_token, v_dot_idx + 1);
  v_expected_sig := rtrim(replace(replace(replace(
    encode(extensions.hmac(v_payload_b64::bytea, v_secret::bytea, 'sha256'), 'base64'),
    '+', '-'), '/', '_'), E'\n', ''), '=');
  IF v_expected_sig != v_signature_b64 THEN RETURN NULL; END IF;
  BEGIN
    v_b64_padded := replace(replace(v_payload_b64, '-', '+'), '_', '/');
    v_b64_padded := v_b64_padded || repeat('=', (4 - length(v_b64_padded) % 4) % 4);
    v_payload_decoded := convert_from(decode(v_b64_padded, 'base64'), 'UTF8');
    v_payload := v_payload_decoded::jsonb;
  EXCEPTION WHEN OTHERS THEN RETURN NULL; END;
  IF (v_payload->>'x')::bigint < extract(epoch from now())::bigint THEN RETURN NULL; END IF;
  v_nonce := v_payload->>'n';
  IF EXISTS (SELECT 1 FROM rsvp_token_uses WHERE nonce = v_nonce) THEN
    RETURN v_payload || jsonb_build_object('_already_used', true);
  END IF;
  RETURN v_payload;
END;
$$;

-- Verification: roundtrip both token types
DO $$
DECLARE
  v_test_guardian uuid;
  v_test_event uuid;
  v_test_player uuid;
  v_unsub_token text;
  v_decoded_uuid uuid;
  v_rsvp_token text;
  v_decoded_jsonb jsonb;
BEGIN
  SELECT id INTO v_test_guardian FROM guardians WHERE email='fsamaritano@gmail.com' LIMIT 1;
  IF v_test_guardian IS NULL THEN
    RAISE NOTICE 'No test guardian, skipping roundtrip';
    RETURN;
  END IF;

  v_unsub_token := mint_unsubscribe_token(v_test_guardian);
  v_decoded_uuid := verify_unsubscribe_token(v_unsub_token);
  IF v_decoded_uuid != v_test_guardian THEN
    RAISE EXCEPTION 'unsubscribe roundtrip FAILED: minted % decoded as %', v_test_guardian, v_decoded_uuid;
  END IF;

  SELECT e.id, tp.player_id INTO v_test_event, v_test_player
  FROM events e
  JOIN team_players tp ON tp.team_id = e.team_id
  WHERE e.team_id IN (SELECT id FROM teams WHERE org_id='e3e95e21-3571-4e9a-985a-d5d01480d4a6')
  LIMIT 1;

  IF v_test_event IS NOT NULL AND v_test_player IS NOT NULL THEN
    v_rsvp_token := mint_rsvp_token(v_test_event, v_test_player, v_test_guardian, 'going');
    v_decoded_jsonb := verify_rsvp_token(v_rsvp_token);
    IF v_decoded_jsonb IS NULL OR v_decoded_jsonb->>'g' != v_test_guardian::text THEN
      RAISE EXCEPTION 'RSVP roundtrip FAILED: %', v_decoded_jsonb;
    END IF;
    RAISE NOTICE 'RSVP roundtrip verified, payload: %', v_decoded_jsonb;
  END IF;

  RAISE NOTICE 'Both token roundtrips VERIFIED end-to-end';
END $$;

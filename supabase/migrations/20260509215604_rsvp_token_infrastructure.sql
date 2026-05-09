-- Wave 4.0: HMAC-signed one-tap RSVP token infrastructure.
--
-- Mint: SECURITY DEFINER plpgsql function reads
--   app.settings.rsvp_token_secret GUC, builds a JSONB payload, signs
--   with HMAC-SHA256, returns base64url(payload).base64url(sig).
-- Verify: matches signature, checks expiry + nonce reuse, returns
--   payload jsonb (with _already_used flag if nonce in
--   rsvp_token_uses).
-- rsvp_token_uses: nonce-keyed audit table that locks single-use.
--
-- Existing UNIQUE on event_rsvps is (event_id, player_id) — no
-- new constraint added. UPSERT on token redemption uses that
-- conflict target (last-guardian-wins; guardian_id stored but not
-- part of the UNIQUE).
--
-- pgcrypto lives in `extensions` schema; functions SET search_path
-- to include it.

CREATE TABLE rsvp_token_uses (
  nonce text PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  player_id uuid REFERENCES players(id) ON DELETE CASCADE,
  guardian_id uuid REFERENCES guardians(id) ON DELETE CASCADE,
  response text NOT NULL CHECK (response IN ('going','maybe','not_going')),
  used_at timestamptz NOT NULL DEFAULT now(),
  used_from_ip inet,
  used_from_ua text
);

CREATE INDEX rsvp_token_uses_event_player_idx
  ON rsvp_token_uses(event_id, player_id);

ALTER TABLE rsvp_token_uses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins read own org token uses"
  ON rsvp_token_uses FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM events e
    JOIN teams t ON t.id = e.team_id
    JOIN user_roles ur ON ur.organization_id = t.org_id
    WHERE e.id = rsvp_token_uses.event_id
      AND ur.user_id = auth.uid()
      AND ur.role IN ('admin','super_admin')
  ));

-- mint_rsvp_token: returns base64url(payload).base64url(sig)
CREATE OR REPLACE FUNCTION public.mint_rsvp_token(
  p_event_id uuid,
  p_player_id uuid,
  p_guardian_id uuid,
  p_response text
) RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = extensions, public, pg_temp
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
  v_secret := current_setting('app.settings.rsvp_token_secret', true);
  IF v_secret IS NULL OR v_secret = '' THEN
    RAISE EXCEPTION 'rsvp_token_secret GUC not set';
  END IF;
  v_nonce := encode(gen_random_bytes(16), 'hex');
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
    encode(hmac(v_payload_b64::bytea, v_secret::bytea, 'sha256'), 'base64'),
    '+', '-'), '/', '_'), E'\n', ''), '=');
  RETURN v_payload_b64 || '.' || v_signature_b64;
END $$;

REVOKE ALL ON FUNCTION public.mint_rsvp_token(uuid,uuid,uuid,text) FROM public;
REVOKE ALL ON FUNCTION public.mint_rsvp_token(uuid,uuid,uuid,text) FROM anon;
GRANT EXECUTE ON FUNCTION public.mint_rsvp_token(uuid,uuid,uuid,text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.verify_rsvp_token(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = extensions, public, pg_temp
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
  v_secret := current_setting('app.settings.rsvp_token_secret', true);
  IF v_secret IS NULL OR v_secret = '' THEN
    RETURN NULL;
  END IF;
  v_dot_idx := position('.' in p_token);
  IF v_dot_idx = 0 THEN RETURN NULL; END IF;
  v_payload_b64 := substring(p_token, 1, v_dot_idx - 1);
  v_signature_b64 := substring(p_token, v_dot_idx + 1);
  v_expected_sig := rtrim(replace(replace(replace(
    encode(hmac(v_payload_b64::bytea, v_secret::bytea, 'sha256'), 'base64'),
    '+', '-'), '/', '_'), E'\n', ''), '=');
  IF v_expected_sig != v_signature_b64 THEN RETURN NULL; END IF;
  BEGIN
    v_b64_padded := replace(replace(v_payload_b64, '-', '+'), '_', '/');
    v_b64_padded := v_b64_padded || repeat('=', (4 - length(v_b64_padded) % 4) % 4);
    v_payload_decoded := convert_from(decode(v_b64_padded, 'base64'), 'UTF8');
    v_payload := v_payload_decoded::jsonb;
  EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
  END;
  IF (v_payload->>'x')::bigint < extract(epoch from now())::bigint THEN
    RETURN NULL;
  END IF;
  v_nonce := v_payload->>'n';
  IF EXISTS (SELECT 1 FROM rsvp_token_uses WHERE nonce = v_nonce) THEN
    RETURN v_payload || jsonb_build_object('_already_used', true);
  END IF;
  RETURN v_payload;
END $$;

REVOKE ALL ON FUNCTION public.verify_rsvp_token(text) FROM public;
REVOKE ALL ON FUNCTION public.verify_rsvp_token(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.verify_rsvp_token(text) TO service_role;

DO $$
DECLARE
  fn_count int;
BEGIN
  SELECT COUNT(*) INTO fn_count FROM information_schema.routines
  WHERE routine_schema='public'
    AND routine_name IN ('mint_rsvp_token','verify_rsvp_token');
  IF fn_count != 2 THEN
    RAISE EXCEPTION 'mint + verify functions not both registered (got %)', fn_count;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema='public' AND table_name='rsvp_token_uses'
  ) THEN
    RAISE EXCEPTION 'rsvp_token_uses table missing';
  END IF;
END $$;

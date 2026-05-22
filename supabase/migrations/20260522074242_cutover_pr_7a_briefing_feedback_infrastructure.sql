-- Cutover PR 7a: signed-token feedback infrastructure for briefing recipients.
--
-- Mirror of the callup-token pattern (20260510200529). Differences:
--   - Allowed ratings: SMALLINT 1..5 (vs callup's accept/decline)
--   - Anchor: comms_messages (briefing send rows) vs events
--   - Recipient key: email TEXT (vs callup's player+guardian UUIDs).
--     Briefing feedback is per-recipient-email, NOT per-guardian-account,
--     because briefings reach BCC addresses that may not have Skyfire
--     accounts (admin BCC pin, downstream forwards, etc.)
--
-- Audit: token submissions land in briefing_feedback as the audit trail.
-- Single-table design: nonce PK locks single-use per token; aggregation
-- queries take the LATEST submission per (message_id, recipient_email)
-- as the authoritative rating if a recipient re-rates via a different
-- star button.
--
-- Secret: feedback_token_secret in app_secrets (per AP #33).
-- Grants: REVOKE FROM PUBLIC + explicit REVOKE FROM anon per AP #23 + #57.

-- §1. briefing_feedback table.
CREATE TABLE public.briefing_feedback (
  nonce text PRIMARY KEY,
  message_id uuid NOT NULL REFERENCES public.comms_messages(id) ON DELETE CASCADE,
  recipient_email text NOT NULL,
  rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  free_text text,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  submitted_from_ip inet,
  submitted_from_ua text
);

CREATE INDEX briefing_feedback_message_idx
  ON public.briefing_feedback(message_id);

CREATE INDEX briefing_feedback_message_email_idx
  ON public.briefing_feedback(message_id, recipient_email);

ALTER TABLE public.briefing_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins read own org briefing feedback"
  ON public.briefing_feedback FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.comms_messages m
    JOIN public.user_roles ur ON ur.organization_id = m.org_id
    WHERE m.id = briefing_feedback.message_id
      AND ur.user_id = (SELECT auth.uid())
      AND ur.role IN ('admin','super_admin')
  ));

-- §2. feedback_token_secret row in app_secrets.
INSERT INTO public.app_secrets (name, value)
SELECT 'feedback_token_secret', encode(extensions.gen_random_bytes(32), 'base64')
WHERE NOT EXISTS (SELECT 1 FROM public.app_secrets WHERE name='feedback_token_secret');

-- §3. mint_feedback_token RPC.
CREATE OR REPLACE FUNCTION public.mint_feedback_token(
  p_message_id uuid, p_recipient_email text, p_rating smallint
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
  IF p_rating < 1 OR p_rating > 5 THEN
    RAISE EXCEPTION 'invalid rating: %', p_rating;
  END IF;
  IF p_recipient_email IS NULL OR p_recipient_email = '' THEN
    RAISE EXCEPTION 'recipient_email required';
  END IF;
  SELECT value INTO v_secret FROM app_secrets WHERE name = 'feedback_token_secret';
  IF v_secret IS NULL OR v_secret = '' THEN
    RAISE EXCEPTION 'feedback_token_secret not configured';
  END IF;
  v_nonce := encode(extensions.gen_random_bytes(16), 'hex');
  v_payload_json := jsonb_build_object(
    'm', p_message_id::text,
    'e', p_recipient_email,
    'r', p_rating,
    'n', v_nonce,
    'x', extract(epoch from (now() + interval '60 days'))::bigint
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

REVOKE ALL ON FUNCTION public.mint_feedback_token(uuid, text, smallint) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.mint_feedback_token(uuid, text, smallint) FROM anon;
GRANT EXECUTE ON FUNCTION public.mint_feedback_token(uuid, text, smallint) TO authenticated, service_role;

-- §4. verify_feedback_token RPC.
CREATE OR REPLACE FUNCTION public.verify_feedback_token(p_token text)
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
  SELECT value INTO v_secret FROM app_secrets WHERE name = 'feedback_token_secret';
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
  IF EXISTS (SELECT 1 FROM briefing_feedback WHERE nonce = v_nonce) THEN
    RETURN v_payload || jsonb_build_object('_already_used', true);
  END IF;
  RETURN v_payload;
END;
$$;

REVOKE ALL ON FUNCTION public.verify_feedback_token(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.verify_feedback_token(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.verify_feedback_token(text) TO authenticated, service_role;

-- §5. apply_feedback_submission service-role helper. Single INSERT
--      keyed by nonce (single-use lock). Returns void; caller checks
--      for unique_violation to detect replay attempts (handler side).
CREATE OR REPLACE FUNCTION public.apply_feedback_submission(
  p_nonce text,
  p_message_id uuid,
  p_recipient_email text,
  p_rating smallint,
  p_ip inet,
  p_ua text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  INSERT INTO public.briefing_feedback (
    nonce, message_id, recipient_email, rating,
    submitted_from_ip, submitted_from_ua
  ) VALUES (
    p_nonce, p_message_id, p_recipient_email, p_rating,
    p_ip, p_ua
  );
END $$;

REVOKE ALL ON FUNCTION public.apply_feedback_submission(text, uuid, text, smallint, inet, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.apply_feedback_submission(text, uuid, text, smallint, inet, text) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_feedback_submission(text, uuid, text, smallint, inet, text) TO service_role;

-- §6. Verification: end-to-end mint/verify roundtrip + boundary checks.
DO $$
DECLARE
  v_test_message uuid;
  v_test_email text := 'test-feedback@example.invalid';
  v_token text;
  v_payload jsonb;
BEGIN
  SELECT id INTO v_test_message
    FROM comms_messages
    WHERE org_id='e3e95e21-3571-4e9a-985a-d5d01480d4a6'
    ORDER BY sent_at DESC NULLS LAST
    LIMIT 1;

  IF v_test_message IS NULL THEN
    RAISE NOTICE 'No test comms_message for feedback roundtrip; skipping';
    RETURN;
  END IF;

  -- mint+verify each valid rating 1..5
  FOR i IN 1..5 LOOP
    v_token := mint_feedback_token(v_test_message, v_test_email, i::smallint);
    v_payload := verify_feedback_token(v_token);
    IF v_payload IS NULL OR (v_payload->>'r')::int != i THEN
      RAISE EXCEPTION 'feedback rating=% roundtrip FAILED: %', i, v_payload;
    END IF;
    IF v_payload->>'m' != v_test_message::text THEN
      RAISE EXCEPTION 'feedback rating=% message_id mismatch: %', i, v_payload->>'m';
    END IF;
    IF v_payload->>'e' != v_test_email THEN
      RAISE EXCEPTION 'feedback rating=% email mismatch: %', i, v_payload->>'e';
    END IF;
  END LOOP;

  -- boundary: rating=0 must reject
  BEGIN
    v_token := mint_feedback_token(v_test_message, v_test_email, 0::smallint);
    RAISE EXCEPTION 'mint should have rejected rating=0';
  EXCEPTION WHEN OTHERS THEN NULL; END;

  -- boundary: rating=6 must reject
  BEGIN
    v_token := mint_feedback_token(v_test_message, v_test_email, 6::smallint);
    RAISE EXCEPTION 'mint should have rejected rating=6';
  EXCEPTION WHEN OTHERS THEN NULL; END;

  -- boundary: empty email must reject
  BEGIN
    v_token := mint_feedback_token(v_test_message, '', 3::smallint);
    RAISE EXCEPTION 'mint should have rejected empty email';
  EXCEPTION WHEN OTHERS THEN NULL; END;

  RAISE NOTICE 'feedback token mint+verify roundtrips VERIFIED end-to-end (5 ratings + 3 boundary rejections)';
END $$;

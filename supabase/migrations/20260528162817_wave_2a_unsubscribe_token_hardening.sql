-- Wave 2.A #15 P0-1 + #11 P1-2 — verify_unsubscribe_token hardening
-- Adds TTL (30d) + replay protection (unsubscribe_token_uses nonce table) + REVOKEs anon EXECUTE
-- Source: docs/AUDIT_WAVE_2A_2026-05-28.md
--
-- AP #21 mirror file: applied via Supabase MCP apply_migration on 2026-05-28
-- (DB-registered version 20260528162817 = filename prefix).

-- 1. Create nonce table (mirrors rsvp/callup pattern; OMITS used_from_ip + used_from_ua per #13 P1-1)
CREATE TABLE IF NOT EXISTS public.unsubscribe_token_uses (
  nonce text PRIMARY KEY,
  guardian_id uuid NOT NULL REFERENCES public.guardians(id) ON DELETE CASCADE,
  used_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS unsubscribe_token_uses_guardian_id_idx
  ON public.unsubscribe_token_uses(guardian_id);

ALTER TABLE public.unsubscribe_token_uses ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.unsubscribe_token_uses FROM PUBLIC;
REVOKE ALL ON TABLE public.unsubscribe_token_uses FROM authenticated;
REVOKE ALL ON TABLE public.unsubscribe_token_uses FROM anon;

COMMENT ON TABLE public.unsubscribe_token_uses IS
  'Nonce table for verify_unsubscribe_token replay protection per Wave 2.A #15 P0-1. Mirrors rsvp_token_uses/callup_token_uses shape minus IP/UA (per #13 P1-1 retention recommendation). Service-role only; RLS enabled with zero policies = deny-by-default per AP #33.';

-- 2. Replace verify_unsubscribe_token body to validate TTL (30d) + nonce check + insert on accept.
-- Token format: '<base64url_payload>.<base64url_hmac_sha256>'
-- Payload is 'guardian_id_uuid:epoch_seconds' joined by ':' (string_to_array).
-- The token text itself (full payload + signature string) is used as the nonce.
CREATE OR REPLACE FUNCTION public.verify_unsubscribe_token(p_token text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_secret text;
  v_dot_idx int;
  v_payload_b64 text;
  v_signature_b64 text;
  v_expected_sig text;
  v_payload text;
  v_parts text[];
  v_guardian_id uuid;
  v_epoch bigint;
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
  BEGIN
    v_guardian_id := v_parts[1]::uuid;
    v_epoch := v_parts[2]::bigint;
  EXCEPTION WHEN OTHERS THEN RETURN NULL; END;
  -- TTL check (30d window from mint epoch). Returns NULL if expired.
  IF v_epoch < extract(epoch from (now() - interval '30 days'))::bigint THEN
    RETURN NULL;
  END IF;
  -- Replay check (fail-loud: return NULL if already consumed, per AP #29).
  IF EXISTS (SELECT 1 FROM public.unsubscribe_token_uses WHERE nonce = p_token) THEN
    RETURN NULL;
  END IF;
  -- Lock nonce single-use before returning success.
  INSERT INTO public.unsubscribe_token_uses (nonce, guardian_id)
    VALUES (p_token, v_guardian_id);
  RETURN v_guardian_id;
EXCEPTION WHEN OTHERS THEN RETURN NULL;
END;
$$;

-- 3. REVOKE anon EXECUTE per AP #23 + AP #57 + #11 P1-2 parity with rsvp/callup verifiers
REVOKE EXECUTE ON FUNCTION public.verify_unsubscribe_token(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.verify_unsubscribe_token(text) FROM anon;

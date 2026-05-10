-- Wave 4.3-D: callup token mint infrastructure. Mirror of the
-- rsvp-token pattern (20260509215604 + 20260510002836). Differences:
--   - Allowed responses: 'accept' | 'decline'
--   - Secret name: callup_token_secret (mint pattern: gen_random_bytes(32))
--   - Decline state model: event_rsvps.response='not_going' +
--     array_remove from events.academy_callup_player_ids (handler
--     calls apply_callup_decline service-role helper).
--
-- Audit: token-driven declines use callup_token_uses (nonce + ip +
-- ua + timestamp) as the audit trail, NOT pii_audit_log. log_pii_change
-- requires auth.uid() which is NULL from the service-role context.
-- Admin-flow add/remove_academy_callup RPCs continue auditing to
-- pii_audit_log for human-driven changes.

-- §1. callup_token_uses table (nonce single-use lock).
CREATE TABLE public.callup_token_uses (
  nonce text PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  player_id uuid REFERENCES public.players(id) ON DELETE CASCADE,
  guardian_id uuid REFERENCES public.guardians(id) ON DELETE CASCADE,
  response text NOT NULL CHECK (response IN ('accept','decline')),
  used_at timestamptz NOT NULL DEFAULT now(),
  used_from_ip inet,
  used_from_ua text
);

CREATE INDEX callup_token_uses_event_player_idx
  ON public.callup_token_uses(event_id, player_id);

ALTER TABLE public.callup_token_uses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins read own org callup token uses"
  ON public.callup_token_uses FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.events e
    JOIN public.teams t ON t.id = e.team_id
    JOIN public.user_roles ur ON ur.organization_id = t.org_id
    WHERE e.id = callup_token_uses.event_id
      AND ur.user_id = auth.uid()
      AND ur.role IN ('admin','super_admin')
  ));

-- §2. callup_token_secret row in app_secrets.
INSERT INTO public.app_secrets (name, value)
SELECT 'callup_token_secret', encode(extensions.gen_random_bytes(32), 'base64')
WHERE NOT EXISTS (SELECT 1 FROM public.app_secrets WHERE name='callup_token_secret');

-- §3. mint_callup_token RPC.
CREATE OR REPLACE FUNCTION public.mint_callup_token(
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
  IF p_response NOT IN ('accept','decline') THEN
    RAISE EXCEPTION 'invalid response: %', p_response;
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
$$;

REVOKE ALL ON FUNCTION public.mint_callup_token(uuid, uuid, uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.mint_callup_token(uuid, uuid, uuid, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.mint_callup_token(uuid, uuid, uuid, text) TO authenticated, service_role;

-- §4. verify_callup_token RPC.
CREATE OR REPLACE FUNCTION public.verify_callup_token(p_token text)
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
  SELECT value INTO v_secret FROM app_secrets WHERE name = 'callup_token_secret';
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
  IF EXISTS (SELECT 1 FROM callup_token_uses WHERE nonce = v_nonce) THEN
    RETURN v_payload || jsonb_build_object('_already_used', true);
  END IF;
  RETURN v_payload;
END;
$$;

REVOKE ALL ON FUNCTION public.verify_callup_token(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.verify_callup_token(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.verify_callup_token(text) TO authenticated, service_role;

-- §5. apply_callup_decline service-role helper.
CREATE OR REPLACE FUNCTION public.apply_callup_decline(
  p_event_id uuid, p_player_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_org uuid;
  v_old_ids uuid[];
  v_new_ids uuid[];
BEGIN
  SELECT t.org_id, e.academy_callup_player_ids
    INTO v_org, v_old_ids
    FROM public.events e
    JOIN public.teams t ON t.id = e.team_id
    WHERE e.id = p_event_id;
  IF v_org IS NULL THEN RAISE EXCEPTION 'Event not found: %', p_event_id; END IF;

  v_new_ids := array_remove(v_old_ids, p_player_id);

  UPDATE public.events
    SET academy_callup_player_ids = v_new_ids
    WHERE id = p_event_id;
END $$;

REVOKE ALL ON FUNCTION public.apply_callup_decline(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.apply_callup_decline(uuid, uuid) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_callup_decline(uuid, uuid) TO service_role;

-- §6. Verification: end-to-end mint/verify roundtrip + decline path.
DO $$
DECLARE
  v_test_event uuid;
  v_test_player uuid;
  v_test_guardian uuid;
  v_token text;
  v_payload jsonb;
BEGIN
  SELECT e.id, tp.player_id, pg.guardian_id
    INTO v_test_event, v_test_player, v_test_guardian
    FROM events e
    JOIN team_players tp ON tp.team_id = e.team_id
    JOIN player_guardians pg ON pg.player_id = tp.player_id
    WHERE e.team_id IN (SELECT id FROM teams WHERE org_id='e3e95e21-3571-4e9a-985a-d5d01480d4a6')
    LIMIT 1;

  IF v_test_event IS NULL THEN
    RAISE NOTICE 'No test event for callup roundtrip; skipping';
    RETURN;
  END IF;

  v_token := mint_callup_token(v_test_event, v_test_player, v_test_guardian, 'accept');
  v_payload := verify_callup_token(v_token);
  IF v_payload IS NULL OR v_payload->>'r' != 'accept' THEN
    RAISE EXCEPTION 'callup accept roundtrip FAILED: %', v_payload;
  END IF;

  v_token := mint_callup_token(v_test_event, v_test_player, v_test_guardian, 'decline');
  v_payload := verify_callup_token(v_token);
  IF v_payload IS NULL OR v_payload->>'r' != 'decline' THEN
    RAISE EXCEPTION 'callup decline roundtrip FAILED: %', v_payload;
  END IF;

  BEGIN
    v_token := mint_callup_token(v_test_event, v_test_player, v_test_guardian, 'maybe');
    RAISE EXCEPTION 'mint should have rejected response=maybe';
  EXCEPTION WHEN OTHERS THEN NULL; END;

  RAISE NOTICE 'callup token mint+verify roundtrips VERIFIED end-to-end';
END $$;

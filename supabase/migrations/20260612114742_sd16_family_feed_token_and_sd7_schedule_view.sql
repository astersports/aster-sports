-- SD-16 phase 1 (SCHEDULE_L99_BUILD_SPEC §2 PR-F' + ratification §5):
-- guardian-scoped family ICS feed. Token minted ONLY via an AUTHED RPC
-- scoped to the calling guardian — never anon, never team-id-derivable,
-- stable URL (calendar clients re-pull; no signed-short-URLs).
-- Plus SD-7 (a-minimal): persisted schedule viewMode.
-- (AP #21 mirror of MCP apply_migration 20260612114742. Verified: anon
-- EXECUTE denied 42501; volatility 'v'; columns live.)

ALTER TABLE guardians
  ADD COLUMN feed_token text UNIQUE,
  ADD COLUMN feed_token_issued_at timestamptz;

-- Mint-or-return for the CALLING guardian only. SECURITY DEFINER so the
-- UPDATE works under the definer while the caller identity gates the row.
CREATE OR REPLACE FUNCTION get_or_create_family_feed_token()
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public
AS $$
DECLARE
  g RECORD;
  new_token text;
BEGIN
  SELECT id, feed_token INTO g FROM guardians
    WHERE user_id = (SELECT auth.uid()) LIMIT 1;
  IF g.id IS NULL THEN
    RETURN NULL; -- caller is not a guardian (staff w/o family): UI hides the entry
  END IF;
  IF g.feed_token IS NOT NULL THEN
    RETURN g.feed_token;
  END IF;
  new_token := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
  UPDATE guardians SET feed_token = new_token, feed_token_issued_at = now() WHERE id = g.id;
  RETURN new_token;
END;
$$;

-- STABLE is wrong for a function that writes; make it VOLATILE.
ALTER FUNCTION get_or_create_family_feed_token() VOLATILE;

-- AP #23 + #57: PUBLIC first, anon explicit, then grant authed.
REVOKE EXECUTE ON FUNCTION get_or_create_family_feed_token() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION get_or_create_family_feed_token() FROM anon;
GRANT EXECUTE ON FUNCTION get_or_create_family_feed_token() TO authenticated;

-- SD-7 (a-minimal): persisted viewMode. Transient filters stay session-local.
ALTER TABLE user_preferences
  ADD COLUMN schedule_view text CHECK (schedule_view IN ('all', 'games'));

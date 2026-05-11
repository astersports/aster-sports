-- Wave 4.3-I — pilot_test_recipient_email column on organization_settings.
-- Applied via chat-side Supabase MCP 2026-05-11 11:58:58 UTC.
--
-- Mirror file per anti-pattern #21 (split-of-labor: chat applies, CC mirrors).
--
-- Override semantics: when pilot_test_recipient_email IS NOT NULL AND a
-- recipient-resolver RPC is called with p_pilot_only=true, the RPC returns
-- a single synthetic row routed to this email. Bypasses the guardian JOIN
-- entirely. Used to verify end-to-end render in pilot mode without sending
-- to real pilot family inboxes.
--
-- Production cutover path: set pilot_test_recipient_email = NULL and flip
-- is_pilot_family = true on real families to start sending to humans.

ALTER TABLE organization_settings
  ADD COLUMN pilot_test_recipient_email text;

COMMENT ON COLUMN organization_settings.pilot_test_recipient_email IS
  'When NOT NULL and pilot_only=true at RPC, get_digest_recipients returns '
  'a single synthetic row for this email. Bypass for end-to-end verification.';

UPDATE organization_settings
SET pilot_test_recipient_email = 'admin@legacyhoopers.org'
WHERE organization_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6';

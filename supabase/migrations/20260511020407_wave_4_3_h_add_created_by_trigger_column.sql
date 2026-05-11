-- Wave 4.3-H — comms_messages.created_by_trigger column (Item 7).
-- Applied via chat-side Supabase MCP 2026-05-11 02:04:07 UTC.
--
-- Mirror file per anti-pattern #21 (split-of-labor: chat applies, CC mirrors).
--
-- Closes the audit-trail diagnostic gap. Every auto-draft now links back
-- to the briefing_triggers row that created it; manual drafts have NULL.
-- Partial index because production query patterns filter to non-null.

ALTER TABLE comms_messages
  ADD COLUMN created_by_trigger uuid
  REFERENCES briefing_triggers(id) ON DELETE SET NULL;

CREATE INDEX comms_messages_created_by_trigger_idx
  ON comms_messages(created_by_trigger)
  WHERE created_by_trigger IS NOT NULL;

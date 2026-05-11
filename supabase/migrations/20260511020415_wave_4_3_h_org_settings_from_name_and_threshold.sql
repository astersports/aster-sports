-- Wave 4.3-H — organization_settings.from_name + nudge_rules update (Items 2 + 8).
-- Applied via chat-side Supabase MCP 2026-05-11 02:04:15 UTC.
--
-- Mirror file per anti-pattern #21 (split-of-labor: chat applies, CC mirrors).
--
-- Item 2: universalize from_name to "Legacy Hoopers" (Frank's locked choice).
--   send-tournament-message reads org_settings.from_name at send time;
--   constant FROM_NAME_FALLBACK kicks in only if column is NULL.
--
-- Item 8: rsvp_coverage_threshold default 0.7 (handleRsvpLow24h gate).
--   Handler skips events where coverage >= threshold; always nudges
--   cold-start (responded=0); skips when no active roster.
--
-- WHERE clause idempotent: only writes if values differ. Re-running this
-- migration is a no-op once both fields are at target state.

UPDATE organization_settings
SET from_name = 'Legacy Hoopers',
    nudge_rules = nudge_rules || jsonb_build_object('rsvp_coverage_threshold', 0.7)
WHERE organization_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6'
  AND (from_name IS DISTINCT FROM 'Legacy Hoopers'
       OR NOT (nudge_rules ? 'rsvp_coverage_threshold'));

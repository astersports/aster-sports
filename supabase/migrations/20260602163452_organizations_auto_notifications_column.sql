-- Closes the deeper concern under Wave 3.A #19 P0-2 + P0-3: the
-- AutoNotificationSettingsSheet UI saves to organizations.auto_notifications
-- but that column was never added to the schema, so every admin toggle save
-- failed silently. The microcopy was fixed in #639; this migration adds the
-- backing column so the saves actually work, AND the next-PR _reminders.ts
-- read of the same column can gate Stream A reminder sends.
--
-- Shape matches what the UI writes:
--   { "reminders_enabled": true|false, "nudges_enabled": true|false }
--
-- Default '{}'::jsonb means: undefined = enabled (the handler reads
-- `reminders_enabled !== false`, matching the UI's own initial-state read).
-- Existing rows get '{}' (no behavior change).

alter table public.organizations
  add column if not exists auto_notifications jsonb not null default '{}'::jsonb;

comment on column public.organizations.auto_notifications is
  'Per-org auto-notification toggles. Shape: { reminders_enabled: bool?, nudges_enabled: bool? }. Read by Stream A (briefing-auto-draft-tick/_reminders.ts) and Stream B handlers. Undefined keys default to enabled. UI: AutoNotificationSettingsSheet.';

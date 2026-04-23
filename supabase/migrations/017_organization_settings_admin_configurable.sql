-- ============================================================
-- 017_organization_settings_admin_configurable.sql
--
-- Adds 6 JSONB columns to organization_settings for admin-configurable
-- org-level rules. Each column has a production-ready default that
-- ships as the Legacy Hoopers pilot starter config; admins tune in
-- Phase 3 admin settings UI.
--
-- Columns:
--   - reminder_cadence: when to auto-send reminders before events
--   - rsvp_deadlines: when RSVPs auto-close
--   - note_rules: RSVP note editing rules (cooldown, visibility)
--   - nudge_rules: call-up response window + RSVP nag behavior
--   - roster_rules: active roster thresholds + call-up triggers
--   - notification_channels: org-level default channels per category
--
-- User-level overrides (user_preferences.notification_preferences,
-- user_preferences.quiet_hours) take precedence over these org
-- defaults. App layer merges org defaults with user overrides at
-- read time.
--
-- RLS: inherits existing organization_settings policies:
--   - All org members read
--   - Admins write (no policy changes needed)
--
-- Pure additive, no destructive ops, no RLS changes, no triggers.
-- Rollback is 6 DROP COLUMN statements (trivial; no rollback file
-- required for this migration).
--
-- Safe to re-apply: idempotent.
-- ============================================================

BEGIN;

-- ============================================================
-- 1. Add 6 JSONB columns with production defaults
-- ============================================================

ALTER TABLE public.organization_settings
  ADD COLUMN IF NOT EXISTS reminder_cadence jsonb NOT NULL DEFAULT '{
    "before_event_hours": [72, 48, 24, 4],
    "per_event_type": {
      "game": [72, 48, 24, 4],
      "practice": [24, 4],
      "tournament": [168, 72, 48, 24, 4],
      "skills_lab": [24, 4],
      "tryout": [72, 24, 4],
      "other": [24]
    }
  }'::jsonb,

  ADD COLUMN IF NOT EXISTS rsvp_deadlines jsonb NOT NULL DEFAULT '{
    "default_hours_before_event": 4,
    "per_event_type": {
      "game": 24,
      "practice": 2,
      "tournament": 168,
      "skills_lab": 24,
      "tryout": 24,
      "other": 4
    }
  }'::jsonb,

  ADD COLUMN IF NOT EXISTS note_rules jsonb NOT NULL DEFAULT '{
    "edit_cooldown_hours": 4,
    "admin_can_override_cooldown": true,
    "max_length_chars": 500,
    "parent_note_visible_to": ["coach", "admin"],
    "coach_note_visible_to": ["coach", "admin"]
  }'::jsonb,

  ADD COLUMN IF NOT EXISTS nudge_rules jsonb NOT NULL DEFAULT '{
    "callup_response_window_hours": 2,
    "callup_concurrent_invites": 1,
    "rsvp_nag_enabled": true,
    "rsvp_nag_delay_hours": 24,
    "rsvp_nag_channels": ["push", "email"]
  }'::jsonb,

  ADD COLUMN IF NOT EXISTS roster_rules jsonb NOT NULL DEFAULT '{
    "active_roster_min": 8,
    "active_roster_target": 10,
    "active_roster_max": 15,
    "call_up_trigger_at_active_count": 8,
    "call_up_urgent_at_active_count": 6,
    "futures_to_active_min_practices": 3
  }'::jsonb,

  ADD COLUMN IF NOT EXISTS notification_channels jsonb NOT NULL DEFAULT '{
    "defaults": {"push": true, "email": true, "sms": false},
    "per_category": {
      "schedule_change": {"push": true, "email": true, "sms": false},
      "rsvp_reminder": {"push": true, "email": false, "sms": false},
      "volunteer_opportunity": {"push": true, "email": true, "sms": false},
      "ride_request": {"push": true, "email": false, "sms": false},
      "briefing": {"push": false, "email": true, "sms": false},
      "score_published": {"push": true, "email": false, "sms": false},
      "announcement": {"push": true, "email": true, "sms": false},
      "chat_mention": {"push": true, "email": false, "sms": false}
    },
    "emergency_override_bypasses_quiet_hours": true
  }'::jsonb;

-- ============================================================
-- 2. COMMENT ON COLUMN for documentation
-- ============================================================

COMMENT ON COLUMN public.organization_settings.reminder_cadence IS
  'When to auto-send event reminders. Keys: before_event_hours (global default, array of hours), per_event_type (map of event_type to hours array). App reads reminder_cadence.per_event_type[event_type] ?? reminder_cadence.before_event_hours. Hours = hours before event.';

COMMENT ON COLUMN public.organization_settings.rsvp_deadlines IS
  'When RSVPs auto-close before event start. Keys: default_hours_before_event (fallback), per_event_type (hours per event_type). App locks RSVP UI when now() > event_start - deadline_hours.';

COMMENT ON COLUMN public.organization_settings.note_rules IS
  'RSVP note editing rules. Keys: edit_cooldown_hours (per-parent cooldown between edits), admin_can_override_cooldown (bool), max_length_chars (note length cap), parent_note_visible_to + coach_note_visible_to (role arrays controlling note visibility).';

COMMENT ON COLUMN public.organization_settings.nudge_rules IS
  'Call-up invite + RSVP nag rules. Keys: callup_response_window_hours (invite timeout), callup_concurrent_invites (1=serial, >1=parallel), rsvp_nag_enabled, rsvp_nag_delay_hours, rsvp_nag_channels (push/email/sms).';

COMMENT ON COLUMN public.organization_settings.roster_rules IS
  'Active roster thresholds. Keys: active_roster_min/target/max (player counts), call_up_trigger_at_active_count (trigger coach call-up UI), call_up_urgent_at_active_count (urgent highlight), futures_to_active_min_practices (how many practices Academy player must attend before eligible for activation).';

COMMENT ON COLUMN public.organization_settings.notification_channels IS
  'Org-level default notification channels per category. Keys: defaults ({push, email, sms} booleans for uncategorized), per_category (category -> channels map), emergency_override_bypasses_quiet_hours (bool). Users override per-category via user_preferences.notification_preferences.';

-- ============================================================
-- 3. CHECK constraints (object shape only per our established pattern)
-- ============================================================

ALTER TABLE public.organization_settings
  DROP CONSTRAINT IF EXISTS organization_settings_reminder_cadence_is_object;
ALTER TABLE public.organization_settings
  ADD CONSTRAINT organization_settings_reminder_cadence_is_object
  CHECK (jsonb_typeof(reminder_cadence) = 'object');

ALTER TABLE public.organization_settings
  DROP CONSTRAINT IF EXISTS organization_settings_rsvp_deadlines_is_object;
ALTER TABLE public.organization_settings
  ADD CONSTRAINT organization_settings_rsvp_deadlines_is_object
  CHECK (jsonb_typeof(rsvp_deadlines) = 'object');

ALTER TABLE public.organization_settings
  DROP CONSTRAINT IF EXISTS organization_settings_note_rules_is_object;
ALTER TABLE public.organization_settings
  ADD CONSTRAINT organization_settings_note_rules_is_object
  CHECK (jsonb_typeof(note_rules) = 'object');

ALTER TABLE public.organization_settings
  DROP CONSTRAINT IF EXISTS organization_settings_nudge_rules_is_object;
ALTER TABLE public.organization_settings
  ADD CONSTRAINT organization_settings_nudge_rules_is_object
  CHECK (jsonb_typeof(nudge_rules) = 'object');

ALTER TABLE public.organization_settings
  DROP CONSTRAINT IF EXISTS organization_settings_roster_rules_is_object;
ALTER TABLE public.organization_settings
  ADD CONSTRAINT organization_settings_roster_rules_is_object
  CHECK (jsonb_typeof(roster_rules) = 'object');

ALTER TABLE public.organization_settings
  DROP CONSTRAINT IF EXISTS organization_settings_notification_channels_is_object;
ALTER TABLE public.organization_settings
  ADD CONSTRAINT organization_settings_notification_channels_is_object
  CHECK (jsonb_typeof(notification_channels) = 'object');

-- ============================================================
-- 4. GIN indexes for future querying
-- (e.g., find orgs with SMS enabled on emergency broadcasts)
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_organization_settings_notification_channels_gin
  ON public.organization_settings USING gin (notification_channels);

-- ============================================================
-- 5. Reload PostgREST schema cache
-- ============================================================
NOTIFY pgrst, 'reload schema';

COMMIT;

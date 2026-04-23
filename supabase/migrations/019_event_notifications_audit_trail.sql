-- ============================================================
-- 019_event_notifications_audit_trail.sql
--
-- Renames notifications_queue to event_notifications (semantic
-- correctness: this table stores full lifecycle of notifications,
-- not just the pending queue). Adds columns for multi-channel
-- tracking, delivery status, read receipts, and change summaries
-- for "notify families on edit" pattern.
--
-- Creates a backward-compat VIEW named notifications_queue so
-- existing frontend code continues to work. View dropped in a
-- later cleanup migration once all queries are updated to use
-- the new table name (tracked as TODO: update references in
-- src/lib/**, src/hooks/** from notifications_queue to
-- event_notifications).
--
-- Columns added:
--   - channels jsonb         Array of channels used (push/email/sms)
--   - delivered_at           Timestamp of delivery confirmation
--   - failed_at              Timestamp of delivery failure
--   - failure_reason         Why delivery failed
--   - read_at                Recipient acknowledged receipt
--   - triggered_by_user_id   Admin/coach who caused the notification
--   - change_summary jsonb   Diff payload for edit notifications
--
-- Plus CHECK constraints (status enum, channels is array),
-- indexes (recipient+time, status+time, triggered_by), and
-- column comments.
--
-- Safe to re-apply: idempotent (IF EXISTS / IF NOT EXISTS patterns).
-- ============================================================

BEGIN;

-- ============================================================
-- 1. Rename notifications_queue to event_notifications
-- ============================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema='public' AND table_name='notifications_queue'
  )
  AND NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema='public' AND table_name='event_notifications'
  )
  THEN
    ALTER TABLE public.notifications_queue RENAME TO event_notifications;
  END IF;
END $$;

COMMENT ON TABLE public.event_notifications IS
  'Full lifecycle record of notifications (queued, sending, sent, delivered, failed, read). Replaces notifications_queue (renamed in Migration 019). Backward-compat VIEW notifications_queue preserved for existing code; drop in follow-up cleanup migration once references are updated.';

-- ============================================================
-- 2. Add new columns (pure additive, IF NOT EXISTS guards re-apply)
-- ============================================================

ALTER TABLE public.event_notifications
  ADD COLUMN IF NOT EXISTS channels jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.event_notifications
  ADD COLUMN IF NOT EXISTS delivered_at timestamptz;

ALTER TABLE public.event_notifications
  ADD COLUMN IF NOT EXISTS failed_at timestamptz;

ALTER TABLE public.event_notifications
  ADD COLUMN IF NOT EXISTS failure_reason text;

ALTER TABLE public.event_notifications
  ADD COLUMN IF NOT EXISTS read_at timestamptz;

ALTER TABLE public.event_notifications
  ADD COLUMN IF NOT EXISTS triggered_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.event_notifications
  ADD COLUMN IF NOT EXISTS change_summary jsonb NOT NULL DEFAULT '{}'::jsonb;

-- ============================================================
-- 3. Column comments
-- ============================================================

COMMENT ON COLUMN public.event_notifications.channels IS
  'JSONB array of channels used: ["push"], ["push","email"], ["sms"], etc. Matches org_settings.notification_channels per-category config. Empty array if still being decided.';

COMMENT ON COLUMN public.event_notifications.delivered_at IS
  'When delivery was confirmed by the provider (APNs/FCM/email service/SMS). Distinct from sent_at which marks when Ember handed off to the provider. Null if not yet delivered or if delivery confirmation is unavailable for that channel.';

COMMENT ON COLUMN public.event_notifications.failed_at IS
  'When delivery failed. Paired with failure_reason. Null if no failure. Failures do not retry automatically; admin can retry via UI.';

COMMENT ON COLUMN public.event_notifications.failure_reason IS
  'Human-readable failure explanation (e.g., "invalid phone", "token expired", "user opted out"). Used in admin support UI. Null if no failure.';

COMMENT ON COLUMN public.event_notifications.read_at IS
  'When the recipient acknowledged receipt (tapped the push, opened the email). Best-effort; null does not mean unread.';

COMMENT ON COLUMN public.event_notifications.triggered_by_user_id IS
  'User whose action caused the notification to be sent. For admin-edited event, this is the admin. For system-scheduled reminders, NULL. Enables admin queries like "notifications I triggered in the last 7 days."';

COMMENT ON COLUMN public.event_notifications.change_summary IS
  'For "notify families on edit" pattern: JSONB describing what changed. Shape: {"field_changes": [{"field": "start_at", "old": "...", "new": "..."}], "summary": "Practice time moved from 5pm to 6pm"}. Empty object for non-edit notifications.';

-- ============================================================
-- 4. CHECK constraints
-- ============================================================

-- status enum (covers queued→sent→delivered→read happy path + failed)
ALTER TABLE public.event_notifications
  DROP CONSTRAINT IF EXISTS event_notifications_status_enum;
ALTER TABLE public.event_notifications
  ADD CONSTRAINT event_notifications_status_enum
  CHECK (status IN ('queued', 'sending', 'sent', 'delivered', 'failed', 'read', 'cancelled'));

-- channels must be a JSONB array (not object, not scalar, not null)
ALTER TABLE public.event_notifications
  DROP CONSTRAINT IF EXISTS event_notifications_channels_is_array;
ALTER TABLE public.event_notifications
  ADD CONSTRAINT event_notifications_channels_is_array
  CHECK (jsonb_typeof(channels) = 'array');

-- change_summary must be a JSONB object
ALTER TABLE public.event_notifications
  DROP CONSTRAINT IF EXISTS event_notifications_change_summary_is_object;
ALTER TABLE public.event_notifications
  ADD CONSTRAINT event_notifications_change_summary_is_object
  CHECK (jsonb_typeof(change_summary) = 'object');

-- failed_at requires failure_reason (pair stays in sync)
ALTER TABLE public.event_notifications
  DROP CONSTRAINT IF EXISTS event_notifications_failure_pair;
ALTER TABLE public.event_notifications
  ADD CONSTRAINT event_notifications_failure_pair
  CHECK (
    (failed_at IS NULL AND failure_reason IS NULL)
    OR (failed_at IS NOT NULL AND failure_reason IS NOT NULL)
  );

-- ============================================================
-- 5. Indexes for hot query paths
-- ============================================================

-- Recipient support queries ("did Frank get the Saturday reminder?")
CREATE INDEX IF NOT EXISTS idx_event_notifications_recipient
  ON public.event_notifications (recipient_id, created_at DESC)
  WHERE recipient_id IS NOT NULL;

-- Admin queries filtered by status + time (e.g., all failures in last 24h)
CREATE INDEX IF NOT EXISTS idx_event_notifications_status_time
  ON public.event_notifications (status, created_at DESC);

-- Admin queries filtered by who triggered (e.g., "my recent notifications")
CREATE INDEX IF NOT EXISTS idx_event_notifications_triggered_by
  ON public.event_notifications (triggered_by_user_id, created_at DESC)
  WHERE triggered_by_user_id IS NOT NULL;

-- Admin queries by event (e.g., all notifications for event X)
CREATE INDEX IF NOT EXISTS idx_event_notifications_event
  ON public.event_notifications (event_id, created_at DESC)
  WHERE event_id IS NOT NULL;

-- Org-scoped lookups (partial index to skip archived/cancelled)
CREATE INDEX IF NOT EXISTS idx_event_notifications_org_status
  ON public.event_notifications (org_id, status, created_at DESC)
  WHERE status NOT IN ('cancelled');

-- GIN index on channels for future "all notifications that used SMS" queries
CREATE INDEX IF NOT EXISTS idx_event_notifications_channels_gin
  ON public.event_notifications USING gin (channels);

-- ============================================================
-- 6. Backward-compat VIEW for existing code
-- Allows frontend code that still references notifications_queue to
-- keep working. Drop this view in a follow-up migration once all
-- references in src/ are updated to event_notifications.
-- ============================================================
CREATE OR REPLACE VIEW public.notifications_queue AS
  SELECT * FROM public.event_notifications;

COMMENT ON VIEW public.notifications_queue IS
  'DEPRECATED backward-compat view. The underlying table was renamed to event_notifications in Migration 019. Frontend code should migrate references to event_notifications. This view will be dropped in a follow-up cleanup migration (TODO).';

-- ============================================================
-- 7. Reload PostgREST schema cache
-- ============================================================
NOTIFY pgrst, 'reload schema';

COMMIT;

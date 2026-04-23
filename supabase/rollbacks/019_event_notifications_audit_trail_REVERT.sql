-- ============================================================
-- 019_event_notifications_audit_trail_REVERT.sql
--
-- Rollback for Migration 019. Run ONLY if Migration 019 causes
-- production regression. This REVERT:
--   1. Drops the backward-compat notifications_queue VIEW
--   2. Drops new columns and constraints
--   3. Drops new indexes
--   4. Renames event_notifications back to notifications_queue
--
-- WARNING: dropping columns destroys any data written to them
-- after 019 applied (channels, delivery tracking, change_summary).
-- Capture first: SELECT * FROM event_notifications;
--
-- Safe to re-apply: idempotent.
-- ============================================================

BEGIN;

-- 1. Drop backward-compat view
DROP VIEW IF EXISTS public.notifications_queue;

-- 2. Drop constraints
ALTER TABLE public.event_notifications DROP CONSTRAINT IF EXISTS event_notifications_status_enum;
ALTER TABLE public.event_notifications DROP CONSTRAINT IF EXISTS event_notifications_channels_is_array;
ALTER TABLE public.event_notifications DROP CONSTRAINT IF EXISTS event_notifications_change_summary_is_object;
ALTER TABLE public.event_notifications DROP CONSTRAINT IF EXISTS event_notifications_failure_pair;

-- 3. Drop indexes
DROP INDEX IF EXISTS public.idx_event_notifications_recipient;
DROP INDEX IF EXISTS public.idx_event_notifications_status_time;
DROP INDEX IF EXISTS public.idx_event_notifications_triggered_by;
DROP INDEX IF EXISTS public.idx_event_notifications_event;
DROP INDEX IF EXISTS public.idx_event_notifications_org_status;
DROP INDEX IF EXISTS public.idx_event_notifications_channels_gin;

-- 4. Drop new columns (WARNING: destroys data written post-019)
ALTER TABLE public.event_notifications
  DROP COLUMN IF EXISTS channels,
  DROP COLUMN IF EXISTS delivered_at,
  DROP COLUMN IF EXISTS failed_at,
  DROP COLUMN IF EXISTS failure_reason,
  DROP COLUMN IF EXISTS read_at,
  DROP COLUMN IF EXISTS triggered_by_user_id,
  DROP COLUMN IF EXISTS change_summary;

-- 5. Rename back to notifications_queue
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema='public' AND table_name='event_notifications'
  )
  AND NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema='public' AND table_name='notifications_queue'
  )
  THEN
    ALTER TABLE public.event_notifications RENAME TO notifications_queue;
  END IF;
END $$;

-- 6. Reload PostgREST cache
NOTIFY pgrst, 'reload schema';

COMMIT;

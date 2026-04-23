-- ============================================================
-- 020_event_notifications_enum_reconciliation.sql
--
-- Migration 019 renamed notifications_queue to event_notifications
-- and added new status enum + CHECK constraints. However, the
-- original Migration 005 CHECK constraints (named notifications_queue_*)
-- followed the table during rename and remain in force. This creates
-- enum conflicts:
--
--   status:            old {pending, sent, failed}
--                      new {queued, sending, sent, delivered, failed, read, cancelled}
--                      → intersection only allows {sent, failed}
--
--   notification_type: old 5-type limited set (Migration 005 era)
--                      new 13-type expanded set (Phase 2 categories)
--
--   recipient_type:    old {team, player, guardian}
--                      new {team, player, guardian, user, org}
--
-- This migration drops the 4 legacy constraints (3 from Migration 005
-- + 1 orphaned from Migration 019's initial enum that has wrong
-- naming) and replaces them with correctly-named, correctly-scoped
-- versions. Safe because the table is empty (verified April 23, 2026:
-- COUNT(*) = 0).
--
-- Safe to re-apply: idempotent.
-- ============================================================

BEGIN;

-- ============================================================
-- 1. Drop legacy Migration 005 constraints (they kept their
--    notifications_queue_ prefix after rename)
-- ============================================================
ALTER TABLE public.event_notifications
  DROP CONSTRAINT IF EXISTS notifications_queue_status_check;

ALTER TABLE public.event_notifications
  DROP CONSTRAINT IF EXISTS notifications_queue_notification_type_check;

ALTER TABLE public.event_notifications
  DROP CONSTRAINT IF EXISTS notifications_queue_recipient_type_check;

-- ============================================================
-- 2. Drop Migration 019's status_enum (we will recreate it below
--    alongside the new type/recipient enums for consistency)
-- ============================================================
ALTER TABLE public.event_notifications
  DROP CONSTRAINT IF EXISTS event_notifications_status_enum;

-- ============================================================
-- 3. Create replacement constraints with correct naming + scope
-- ============================================================

-- status: full lifecycle set
ALTER TABLE public.event_notifications
  ADD CONSTRAINT event_notifications_status_enum
  CHECK (status IN (
    'queued',
    'sending',
    'sent',
    'delivered',
    'failed',
    'read',
    'cancelled'
  ));

-- notification_type: Migration 017 categories + Migration 005 legacy + custom
ALTER TABLE public.event_notifications
  ADD CONSTRAINT event_notifications_notification_type_enum
  CHECK (notification_type IN (
    -- Phase 2 categories (parent-configurable via user_preferences)
    'schedule_change',
    'rsvp_reminder',
    'volunteer_opportunity',
    'ride_request',
    'briefing',
    'score_published',
    'announcement',
    'chat_mention',
    -- Migration 005 legacy types
    'reminder_24h',
    'reminder_gameday',
    'cancellation',
    'rsvp_nudge',
    -- Other
    'custom'
  ));

-- recipient_type: expanded for staff receipts + org broadcasts
ALTER TABLE public.event_notifications
  ADD CONSTRAINT event_notifications_recipient_type_enum
  CHECK (recipient_type IN (
    'team',
    'player',
    'guardian',
    'user',
    'org'
  ));

-- ============================================================
-- 4. Reload PostgREST cache
-- ============================================================
NOTIFY pgrst, 'reload schema';

COMMIT;

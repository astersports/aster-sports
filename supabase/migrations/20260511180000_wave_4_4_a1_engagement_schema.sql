-- ============================================================
-- Wave 4.4-A1 — comms_message_recipients engagement schema expansion
-- ============================================================
--
-- Background: today the table tracks only `delivery_status` (enum) and
-- `opened_at` (timestamp). The Resend webhook supports 8 event types
-- with corresponding state, but the schema only lands 4 of them
-- (delivered, opened, bounced, complained — and 'complained' currently
-- fails its own CHECK constraint because it wasn't yet in the allowed
-- enum). The other 4 (clicked, sent, failed, delivery_delayed) drop on
-- the floor.
--
-- This migration:
--   1. Adds 5 new timestamp columns mirroring opened_at's shape, one
--      per Resend event type that has a meaningful "first time" state.
--   2. Widens the delivery_status CHECK constraint to include 'clicked'
--      and 'complained' (the receiver already attempts to write
--      'complained'; the existing constraint silently rejects the
--      UPDATE).
--
-- After this migration:
--   - The v2 receiver-as-coded immediately starts succeeding on
--     email.complained events (no more rejected UPDATEs).
--   - Wave 4.4-A2 (next) will rewrite the receiver to handle 8 event
--     types and write to the 5 new timestamp columns.
--
-- Nullable-by-design: NULL on the new columns is the correct value for
-- existing rows (those events weren't tracked at the time). No backfill.
--
-- Idempotent: ADD COLUMN IF NOT EXISTS + DROP CONSTRAINT IF EXISTS.
-- Constraint name kept as `tournament_message_recipients_delivery_status_check`
-- per the rename-but-keep-name pattern established in
-- 20260508234920_comms_foundation_polymorphic_rename.sql.
-- ============================================================

BEGIN;

-- Step 1: 5 new timestamp columns. Nullable, no default.
ALTER TABLE public.comms_message_recipients
  ADD COLUMN IF NOT EXISTS clicked_at      timestamptz,
  ADD COLUMN IF NOT EXISTS bounced_at      timestamptz,
  ADD COLUMN IF NOT EXISTS delivered_at    timestamptz,
  ADD COLUMN IF NOT EXISTS unsubscribed_at timestamptz,
  ADD COLUMN IF NOT EXISTS complained_at   timestamptz;

-- Step 2: Widen delivery_status enum to cover the 2 missing Resend
-- event types ('clicked' for tracked click-through, 'complained' for
-- spam reports). All existing values preserved.
ALTER TABLE public.comms_message_recipients
  DROP CONSTRAINT IF EXISTS tournament_message_recipients_delivery_status_check;

ALTER TABLE public.comms_message_recipients
  ADD CONSTRAINT tournament_message_recipients_delivery_status_check
  CHECK (delivery_status = ANY (ARRAY[
    'queued', 'sent', 'delivered', 'opened', 'clicked',
    'bounced', 'complained', 'unsubscribed', 'failed'
  ]::text[]));

COMMIT;

NOTIFY pgrst, 'reload schema';

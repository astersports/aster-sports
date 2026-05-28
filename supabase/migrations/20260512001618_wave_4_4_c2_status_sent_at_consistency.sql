-- ============================================================
-- Wave 4.4-C2 — comms_messages.status state machine consistency
-- ============================================================
--
-- Background: prior to this wave, digestSend.js wrote weekly_digest
-- rows with status='draft' and never UPDATEd the status after the
-- edge function set sent_at. Result: 7+ production rows with
-- (status='draft', sent_at IS NOT NULL) — broken state machine.
-- Every briefing-queue filter and audit query treated them as drafts.
--
-- The companion code fix in this wave (digestSend.js, ~line 153)
-- mirrors composerSubmit.js:124 — flip status='sent' after the edge
-- function dispatch succeeds. With the code fix shipped, this
-- migration:
--   1. Backfills existing inconsistent rows.
--   2. Adds a CHECK constraint that prevents future regressions of
--      the same bug pattern (across all comms_messages writers,
--      not just digestSend).
--
-- Idempotent: DO blocks guard re-application.
-- ============================================================

BEGIN;

-- Step 1: backfill any (status='draft', sent_at IS NOT NULL) rows.
-- These are pre-fix digestSend.js sends whose status never got flipped.
UPDATE public.comms_messages
SET status = 'sent'
WHERE sent_at IS NOT NULL
  AND status = 'draft';

-- Step 2: enforce status <-> sent_at consistency going forward.
-- Constraint reads: row is 'sent' if and only if sent_at is non-null.
-- Valid combinations:
--   status='draft',     sent_at IS NULL      ✓
--   status='scheduled', sent_at IS NULL      ✓
--   status='queued',    sent_at IS NULL      ✓
--   status='sent',      sent_at IS NOT NULL  ✓
-- Forbidden:
--   status='sent',      sent_at IS NULL      ✗ (premature flip)
--   status!='sent',     sent_at IS NOT NULL  ✗ (forgotten flip — the bug)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'comms_messages_status_sent_at_consistent'
      AND conrelid = 'public.comms_messages'::regclass
  ) THEN
    ALTER TABLE public.comms_messages
      ADD CONSTRAINT comms_messages_status_sent_at_consistent
        CHECK ((status = 'sent') = (sent_at IS NOT NULL));
  END IF;
END $$;

COMMIT;

NOTIFY pgrst, 'reload schema';

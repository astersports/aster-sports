-- G5 (recovery sweep, Option C) — reliability cap on the cron failed-redrive.
-- Additive, reversible. The cron re-drives delivery_status='failed' rows
-- (batch-rejection, no email sent) up to 3 times; redrive_count bounds it so a
-- persistently-failing batch can't hammer Resend every tick at go-live scale.
-- At redrive_count >= 3 the row stops auto-re-driving and surfaces in the Radar
-- "Sends needing review" region as an escalation.
-- Mirror of MCP-applied migration 20260608002737 (AP#21).
ALTER TABLE public.comms_message_recipients
  ADD COLUMN IF NOT EXISTS redrive_count integer NOT NULL DEFAULT 0;

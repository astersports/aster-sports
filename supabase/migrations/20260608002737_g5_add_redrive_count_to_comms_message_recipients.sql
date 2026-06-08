-- Migration: 20260608002737_g5_add_redrive_count_to_comms_message_recipients
-- As-applied mirror (applied via MCP in the G5 PR 1a session; column verified live
-- 2026-06-08: integer NOT NULL DEFAULT 0). redrive_count caps the cron's failed-row
-- re-drive (G5 OPT-B): >= 3 attempts -> escalate (no further auto-re-drive).
ALTER TABLE public.comms_message_recipients
  ADD COLUMN IF NOT EXISTS redrive_count integer NOT NULL DEFAULT 0;

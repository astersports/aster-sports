-- Migration: 20260608083740_narrow_weekly_digest_unique_drop_draft
-- Applied via Supabase MCP apply_migration on 2026-06-08 (design lane). Verbatim
-- mirror of the registered migration; do not edit.
-- Tier 0 / BUG A: narrow weekly_digest uniqueness to committed states only.
-- Live predicate included 'draft', causing 23505 churn (archive-reinsert -> 27
-- archived). Dropping 'draft' stops the churn; draft-dedup stays at the app layer
-- (draftExists + the digestSend.js 23505-catch). Removing a value from a partial-
-- unique predicate cannot violate existing rows.
-- SUPERSEDES the never-applied orphan ghost file 20260603104534 (same logical
-- change). Retire that file when committing this one.

DROP INDEX IF EXISTS comms_messages_weekly_digest_unique;
CREATE UNIQUE INDEX comms_messages_weekly_digest_unique
  ON public.comms_messages USING btree (org_id, period_start)
  WHERE ((kind = 'weekly_digest'::text)
         AND (status = ANY (ARRAY['scheduled'::text, 'queued'::text, 'sent'::text])));

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes
    WHERE tablename='comms_messages' AND indexname='comms_messages_weekly_digest_unique') THEN
    RAISE EXCEPTION 'post-condition failed: weekly_digest unique index missing after recreate';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_indexes
    WHERE tablename='comms_messages' AND indexname='comms_messages_weekly_digest_unique'
      AND indexdef ILIKE '%draft%') THEN
    RAISE EXCEPTION 'post-condition failed: draft still in weekly_digest unique predicate';
  END IF;
END $$;

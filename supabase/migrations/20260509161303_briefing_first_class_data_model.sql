-- ═══════════════════════════════════════════════════════════════
-- Wave 3.10 — Briefing first-class system data model
-- ═══════════════════════════════════════════════════════════════
-- Adds anchor + audience + status columns to comms_messages so
-- briefings become first-class regardless of kind. Backfills
-- existing rows from legacy tournament_id/team_id columns.
-- Adds briefing_inbox_preferences for per-admin saved filters.
--
-- Schema is additive. Existing columns (tournament_id, team_id,
-- sent_at) preserved as legacy anchors during transition.
-- ═══════════════════════════════════════════════════════════════

-- §1. Add new columns to comms_messages (all nullable initially)
ALTER TABLE public.comms_messages
  ADD COLUMN IF NOT EXISTS anchor_kind text,
  ADD COLUMN IF NOT EXISTS anchor_id uuid,
  ADD COLUMN IF NOT EXISTS audience_type text,
  ADD COLUMN IF NOT EXISTS audience_filter jsonb,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS scheduled_for timestamptz,
  ADD COLUMN IF NOT EXISTS last_edited_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_edited_by uuid REFERENCES auth.users(id);

-- §2. Backfill status from sent_at (rows with sent_at populated → 'sent')
UPDATE public.comms_messages
SET status = 'sent'
WHERE sent_at IS NOT NULL AND status = 'draft';

-- §3. Backfill anchor_kind + anchor_id from legacy columns
UPDATE public.comms_messages
SET
  anchor_kind = 'tournament',
  anchor_id = tournament_id,
  audience_type = 'tournament_attendees'
WHERE tournament_id IS NOT NULL AND anchor_kind IS NULL;

UPDATE public.comms_messages
SET
  anchor_kind = 'team',
  anchor_id = team_id,
  audience_type = 'team'
WHERE team_id IS NOT NULL AND tournament_id IS NULL AND anchor_kind IS NULL;

-- §4. weekly_digest backfill (no legacy anchor → org-scoped)
UPDATE public.comms_messages
SET
  anchor_kind = 'org',
  anchor_id = org_id,
  audience_type = 'org_all'
WHERE kind = 'weekly_digest' AND anchor_kind IS NULL;

-- §5. schedule_change backfill from event_change_audit join
UPDATE public.comms_messages cm
SET
  anchor_kind = 'event',
  anchor_id = eca.event_id,
  audience_type = 'event_attendees'
FROM public.event_change_audit eca
WHERE eca.dispatch_email_id = cm.id
  AND cm.kind = 'schedule_change'
  AND cm.anchor_kind IS NULL;

-- §6. Apply CHECK constraints AFTER backfill
ALTER TABLE public.comms_messages
  ADD CONSTRAINT comms_messages_anchor_kind_check
    CHECK (anchor_kind IS NULL OR anchor_kind IN ('event', 'tournament', 'team', 'org')),
  ADD CONSTRAINT comms_messages_audience_type_check
    CHECK (audience_type IS NULL OR audience_type IN
      ('team', 'multi_team', 'tournament_attendees', 'event_attendees', 'org_all', 'custom')),
  ADD CONSTRAINT comms_messages_status_check
    CHECK (status IN ('draft', 'scheduled', 'queued', 'sent', 'failed', 'archived'));

-- §7. Indexes for inbox queries (action queue + history)
CREATE INDEX IF NOT EXISTS comms_messages_org_status_idx
  ON public.comms_messages (org_id, status, scheduled_for NULLS LAST);

CREATE INDEX IF NOT EXISTS comms_messages_anchor_idx
  ON public.comms_messages (anchor_kind, anchor_id)
  WHERE anchor_kind IS NOT NULL;

CREATE INDEX IF NOT EXISTS comms_messages_scheduled_for_idx
  ON public.comms_messages (scheduled_for)
  WHERE status = 'scheduled';

CREATE INDEX IF NOT EXISTS comms_messages_org_kind_status_idx
  ON public.comms_messages (org_id, kind, status);

-- §8. Per-admin saved filters table (E5: filter dimensions persist per-admin)
CREATE TABLE IF NOT EXISTS public.briefing_inbox_preferences (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  saved_filters jsonb NOT NULL DEFAULT '[]'::jsonb,
  default_kind_filter text[] DEFAULT NULL,
  default_team_filter uuid[] DEFAULT NULL,
  default_date_filter text DEFAULT 'this_week',
  active_tab_default text DEFAULT 'active',
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, org_id)
);

ALTER TABLE public.briefing_inbox_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY briefing_inbox_preferences_own
  ON public.briefing_inbox_preferences FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- §9. Verification block (rolls back transaction if any check fails)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='comms_messages' AND column_name='status')
    THEN RAISE EXCEPTION 'comms_messages.status column missing'; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='comms_messages' AND column_name='anchor_kind')
    THEN RAISE EXCEPTION 'comms_messages.anchor_kind column missing'; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='comms_messages' AND column_name='audience_type')
    THEN RAISE EXCEPTION 'comms_messages.audience_type column missing'; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='comms_messages' AND column_name='scheduled_for')
    THEN RAISE EXCEPTION 'comms_messages.scheduled_for column missing'; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables
    WHERE table_schema='public' AND table_name='briefing_inbox_preferences')
    THEN RAISE EXCEPTION 'briefing_inbox_preferences table not created'; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes
    WHERE schemaname='public' AND tablename='comms_messages' AND indexname='comms_messages_org_status_idx')
    THEN RAISE EXCEPTION 'org_status index missing'; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes
    WHERE schemaname='public' AND tablename='comms_messages' AND indexname='comms_messages_scheduled_for_idx')
    THEN RAISE EXCEPTION 'scheduled_for partial index missing'; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='briefing_inbox_preferences')
    THEN RAISE EXCEPTION 'RLS policy missing on briefing_inbox_preferences'; END IF;
END $$;

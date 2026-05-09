-- Wave 3.17: enable pg_cron + pg_net, add briefing_reminders table.
--
-- pg_net creates objects in the `net` schema. Earlier attempt with
-- `WITH SCHEMA net` failed because the schema doesn't pre-exist; the
-- extension auto-creates it. The follow-up migration
-- 20260509191037_schedule_briefing_dispatch_cron_tick registers the
-- pg_cron job that hits net.http_post.

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
GRANT USAGE ON SCHEMA cron TO postgres;

-- briefing_reminders: tracks weekly_digest_due dismissal so an admin
-- can skip a week without re-prompting the next Sun→Mon window.
-- useNeedsBriefing (PR #43) computes the synthetic queue item; this
-- table records the dismissal so the queue item filters out.
CREATE TABLE briefing_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('weekly_digest')),
  due_at timestamptz NOT NULL,
  dismissed_at timestamptz,
  dismissed_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT briefing_reminders_org_kind_week_unique
    UNIQUE (org_id, kind, due_at)
);

CREATE INDEX briefing_reminders_org_kind_idx
  ON briefing_reminders(org_id, kind);
CREATE INDEX briefing_reminders_due_at_idx
  ON briefing_reminders(due_at)
  WHERE dismissed_at IS NULL;

ALTER TABLE briefing_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins read own org reminders"
  ON briefing_reminders FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.organization_id = briefing_reminders.org_id
      AND ur.role IN ('admin','super_admin')
  ));

CREATE POLICY "admins write own org reminders"
  ON briefing_reminders FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.organization_id = briefing_reminders.org_id
      AND ur.role IN ('admin','super_admin')
  ));

CREATE POLICY "admins update own org reminders"
  ON briefing_reminders FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.organization_id = briefing_reminders.org_id
      AND ur.role IN ('admin','super_admin')
  ));

DO $$
DECLARE
  ext_count integer;
  table_count integer;
BEGIN
  SELECT COUNT(*) INTO ext_count
  FROM pg_extension WHERE extname IN ('pg_cron','pg_net');
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema='public' AND table_name='briefing_reminders';
  IF ext_count != 2 THEN RAISE EXCEPTION 'pg_cron + pg_net not both installed (got %)', ext_count; END IF;
  IF table_count != 1 THEN RAISE EXCEPTION 'briefing_reminders table missing'; END IF;
END $$;

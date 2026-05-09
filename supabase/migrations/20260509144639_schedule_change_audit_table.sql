-- Wave 3.8 §5.2: event_change_audit table
-- Records every admin/coach edit to events.start_at / end_at / location /
-- status='cancelled' (the four "trigger fields" that warrant family
-- notification). Foreign key to comms_messages tracks whether a
-- schedule_change email was actually dispatched. NULL dispatch_email_id
-- means admin chose "Skip" on the notify-families prompt.
--
-- org_id duplicated from events.team.org_id for direct RLS scoping
-- (events table has no org_id column; org flows via team_id → teams.org_id).
-- Application-level helper joins teams to derive org_id at insert time.
--
-- RLS:
--   SELECT — any user with a user_roles row in this org
--   INSERT — admin or coach in this org
--
-- Anti-pattern #20 reminder: WITH CHECK on the INSERT policy is explicit
-- (cmd='INSERT' implicitly USING=NULL but WITH CHECK is the gate).

CREATE TABLE public.event_change_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  changed_by uuid NOT NULL REFERENCES auth.users(id),
  changed_at timestamptz NOT NULL DEFAULT now(),
  change_kind text NOT NULL CHECK (change_kind IN ('time','location','cancelled','other')),
  recurrence_scope text NOT NULL CHECK (recurrence_scope IN ('instance','this_and_future','series')),
  before_jsonb jsonb,
  after_jsonb jsonb,
  dispatch_email_id uuid REFERENCES comms_messages(id) ON DELETE SET NULL
);

CREATE INDEX event_change_audit_org_changed_idx
  ON public.event_change_audit (org_id, changed_at DESC);
CREATE INDEX event_change_audit_event_idx
  ON public.event_change_audit (event_id);
CREATE INDEX event_change_audit_dispatch_idx
  ON public.event_change_audit (dispatch_email_id)
  WHERE dispatch_email_id IS NOT NULL;

ALTER TABLE public.event_change_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY event_change_audit_select_org
  ON public.event_change_audit FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.organization_id = event_change_audit.org_id
    )
  );

CREATE POLICY event_change_audit_insert_admin_coach
  ON public.event_change_audit FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.organization_id = event_change_audit.org_id
        AND ur.role IN ('admin','coach')
    )
  );

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables
    WHERE table_schema='public' AND table_name='event_change_audit')
    THEN RAISE EXCEPTION 'event_change_audit not created'; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='event_change_audit'
      AND policyname='event_change_audit_select_org')
    THEN RAISE EXCEPTION 'select policy missing'; END IF;
END $$;

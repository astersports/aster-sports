-- ============================================================
-- COMMS FOUNDATION
-- Rename tournament_messages -> comms_messages with polymorphic
-- kind enum, per-recipient body storage, content_sections JSONB,
-- staff_profiles (user_id, org_id) PK, org_briefing_contacts,
-- pii_audit_log, guardian_email_preferences, events roster lock
-- columns, tournaments hotel block.
--
-- Cleanup: drop 8 vestigial columns from prior iterations
-- (all 0/6 rows used in production).
-- ============================================================

-- 1. RENAME tables and column
ALTER TABLE public.tournament_messages RENAME TO comms_messages;
ALTER TABLE public.tournament_message_recipients RENAME TO comms_message_recipients;
ALTER TABLE public.comms_messages RENAME COLUMN message_type TO kind;
ALTER TABLE public.comms_messages
  RENAME CONSTRAINT tournament_messages_team_id_fkey TO comms_messages_team_id_fkey;

-- 2. DROP vestigial columns (all 0/6 rows used in production)
ALTER TABLE public.comms_messages DROP COLUMN IF EXISTS message_group_id;
ALTER TABLE public.comms_messages DROP COLUMN IF EXISTS custom_header;
ALTER TABLE public.comms_messages DROP COLUMN IF EXISTS custom_subheader;
ALTER TABLE public.comms_messages DROP COLUMN IF EXISTS custom_narrative;
ALTER TABLE public.comms_messages DROP COLUMN IF EXISTS custom_closing;
ALTER TABLE public.comms_messages DROP COLUMN IF EXISTS custom_signoff;
ALTER TABLE public.comms_messages DROP COLUMN IF EXISTS replaces_message_id;
ALTER TABLE public.comms_messages DROP COLUMN IF EXISTS displayed_from_user_id;

-- 3. DROP OLD CHECK constraint BEFORE updating values
--    (old constraint allows only old enum names; UPDATE in step 5 produces new names)
ALTER TABLE public.comms_messages DROP CONSTRAINT IF EXISTS tournament_messages_message_type_check;

-- 4. RELAX tournament_id (now nullable for digest, multi_team_notice, custom)
ALTER TABLE public.comms_messages ALTER COLUMN tournament_id DROP NOT NULL;

-- 5. ENUM migration: rename existing kinds to canonical names
UPDATE public.comms_messages
SET kind = CASE kind
  WHEN 'preliminary_schedule' THEN 'tournament_preliminary'
  WHEN 'final_schedule' THEN 'tournament_final'
  WHEN 'rsvp_lock' THEN 'tournament_rsvp_lock'
  WHEN 'weekend_recap' THEN 'tournament_recap_final'
  WHEN 'day1_recap' THEN 'tournament_recap_interim'
  WHEN 'saturday_scenarios' THEN 'tournament_recap_interim'
  ELSE kind
END;

-- 6. ADD new CHECK constraint (allows the canonical kinds)
ALTER TABLE public.comms_messages
  ADD CONSTRAINT comms_messages_kind_check
  CHECK (kind = ANY (ARRAY[
    'weekly_digest',
    'tournament_preliminary',
    'tournament_final',
    'tournament_rsvp_lock',
    'tournament_recap_interim',
    'tournament_recap_final',
    'schedule_change',
    'multi_team_notice',
    'custom'
  ]::text[]));

-- 7. NEW columns on comms_messages — operator-authored content + period
ALTER TABLE public.comms_messages ADD COLUMN headline text;
ALTER TABLE public.comms_messages ADD COLUMN sub_context text;
ALTER TABLE public.comms_messages ADD COLUMN signoff_message text;
ALTER TABLE public.comms_messages ADD COLUMN body_notes text;
ALTER TABLE public.comms_messages ADD COLUMN content_sections jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.comms_messages ADD COLUMN period_start date;
ALTER TABLE public.comms_messages ADD COLUMN period_end date;

COMMENT ON COLUMN public.comms_messages.headline IS
  'Operator-authored mood headline. Examples: TIME TO BREATHE, WEEK AHEAD, GAME DAY.';
COMMENT ON COLUMN public.comms_messages.sub_context IS
  'Optional sub-headline. Auto-rendered from stats if null. Operator override possible.';
COMMENT ON COLUMN public.comms_messages.signoff_message IS
  'Closing prose before signature. Operator-typed personal voice.';
COMMENT ON COLUMN public.comms_messages.body_notes IS
  'Free-text "this week''s notes" for digest kind. NULL otherwise.';
COMMENT ON COLUMN public.comms_messages.content_sections IS
  'Array of section configs. Each: {kind, position, ...kind-specific fields}. Extensible without migration.';

-- 8. NEW columns on comms_message_recipients — per-recipient body storage
-- (guardian_id already exists with correct FK; skip)
ALTER TABLE public.comms_message_recipients ADD COLUMN body_html_rendered text;
ALTER TABLE public.comms_message_recipients ADD COLUMN body_plain_rendered text;
ALTER TABLE public.comms_message_recipients ADD COLUMN subject_rendered text;
ALTER TABLE public.comms_message_recipients ADD COLUMN teams_included uuid[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN public.comms_message_recipients.body_html_rendered IS
  'Exact HTML this recipient received. Source of truth for "what did Sarah see" audit.';
COMMENT ON COLUMN public.comms_message_recipients.teams_included IS
  'For digest: array of team_ids covered in this recipient body. For per-team kinds: single team_id.';

-- 9. RENAME RLS policies for cleanliness
ALTER POLICY tournament_messages_read ON public.comms_messages RENAME TO comms_messages_read;
ALTER POLICY tournament_messages_write ON public.comms_messages RENAME TO comms_messages_write;
ALTER POLICY tmr_read ON public.comms_message_recipients RENAME TO cmr_read;
ALTER POLICY tmr_write ON public.comms_message_recipients RENAME TO cmr_write;

-- 10. STAFF_PROFILES: drop old PK, add org_id, recreate composite PK, add title
ALTER TABLE public.staff_profiles DROP CONSTRAINT staff_profiles_pkey;
ALTER TABLE public.staff_profiles ADD COLUMN org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;

UPDATE public.staff_profiles sp
SET org_id = (
  SELECT organization_id FROM public.user_roles ur
  WHERE ur.user_id = sp.user_id
  ORDER BY created_at ASC LIMIT 1
);

ALTER TABLE public.staff_profiles ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE public.staff_profiles ADD PRIMARY KEY (user_id, org_id);

ALTER TABLE public.staff_profiles ADD COLUMN title text;
COMMENT ON COLUMN public.staff_profiles.title IS
  'How this person renders in briefing footers. Examples: Program Director, Head Coach, '
  'Assistant Coach, Team Admin. Falls back to humanized team_staff.role when blank.';

CREATE POLICY staff_profiles_admin_update ON public.staff_profiles
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur_admin
      WHERE ur_admin.user_id = auth.uid()
        AND ur_admin.role = 'admin'
        AND ur_admin.organization_id = staff_profiles.org_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur_admin
      WHERE ur_admin.user_id = auth.uid()
        AND ur_admin.role = 'admin'
        AND ur_admin.organization_id = staff_profiles.org_id
    )
  );

-- 11. ORG_BRIEFING_CONTACTS table + granular RLS
CREATE TABLE public.org_briefing_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  UNIQUE (org_id, user_id)
);

CREATE INDEX org_briefing_contacts_org_idx ON public.org_briefing_contacts(org_id, sort_order);

ALTER TABLE public.org_briefing_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY org_briefing_contacts_select_member ON public.org_briefing_contacts
  FOR SELECT TO authenticated
  USING (org_id IN (SELECT organization_id FROM public.user_roles WHERE user_id = auth.uid()));

CREATE POLICY org_briefing_contacts_insert_admin ON public.org_briefing_contacts
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (SELECT organization_id FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY org_briefing_contacts_update_admin ON public.org_briefing_contacts
  FOR UPDATE TO authenticated
  USING (org_id IN (SELECT organization_id FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (org_id IN (SELECT organization_id FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY org_briefing_contacts_delete_admin ON public.org_briefing_contacts
  FOR DELETE TO authenticated
  USING (org_id IN (SELECT organization_id FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- 12. PII_AUDIT_LOG table + SECURITY DEFINER insert RPC
CREATE TABLE public.pii_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid NOT NULL REFERENCES auth.users(id),
  target_table text NOT NULL,
  target_record_id uuid NOT NULL,
  field_changed text NOT NULL,
  old_value text,
  new_value text,
  ts timestamptz NOT NULL DEFAULT NOW(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE
);

CREATE INDEX pii_audit_log_actor_idx ON public.pii_audit_log(actor_user_id, ts DESC);
CREATE INDEX pii_audit_log_target_idx ON public.pii_audit_log(target_table, target_record_id, ts DESC);
CREATE INDEX pii_audit_log_org_idx ON public.pii_audit_log(org_id, ts DESC);

ALTER TABLE public.pii_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY pii_audit_log_admin_select ON public.pii_audit_log
  FOR SELECT TO authenticated
  USING (org_id IN (SELECT organization_id FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE OR REPLACE FUNCTION public.log_pii_change(
  p_target_table text,
  p_target_record_id uuid,
  p_field_changed text,
  p_old_value text,
  p_new_value text,
  p_org_id uuid
) RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
  INSERT INTO public.pii_audit_log (
    actor_user_id, target_table, target_record_id,
    field_changed, old_value, new_value, org_id
  ) VALUES (
    auth.uid(), p_target_table, p_target_record_id,
    p_field_changed, p_old_value, p_new_value, p_org_id
  )
  RETURNING id;
$$;

GRANT EXECUTE ON FUNCTION public.log_pii_change(text, uuid, text, text, text, uuid) TO authenticated;

-- 13. GUARDIAN_EMAIL_PREFERENCES (CAN-SPAM future-proofing)
CREATE TABLE public.guardian_email_preferences (
  guardian_id uuid PRIMARY KEY REFERENCES public.guardians(id) ON DELETE CASCADE,
  digest_subscribed boolean NOT NULL DEFAULT true,
  tournament_subscribed boolean NOT NULL DEFAULT true,
  unsubscribed_at timestamptz,
  unsubscribe_token uuid NOT NULL DEFAULT gen_random_uuid(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX guardian_email_prefs_token_idx
  ON public.guardian_email_preferences(unsubscribe_token)
  WHERE unsubscribed_at IS NULL;

ALTER TABLE public.guardian_email_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY guardian_email_prefs_select_self_or_staff ON public.guardian_email_preferences
  FOR SELECT TO authenticated
  USING (
    guardian_id IN (SELECT id FROM public.guardians WHERE user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.guardians g
      JOIN public.user_roles ur ON ur.organization_id = g.org_id
      WHERE g.id = guardian_email_preferences.guardian_id
        AND ur.user_id = auth.uid()
        AND ur.role IN ('admin', 'coach')
    )
  );

-- 14. EVENTS roster lock + academy callup columns
ALTER TABLE public.events ADD COLUMN locked_roster_player_ids uuid[] NOT NULL DEFAULT '{}';
ALTER TABLE public.events ADD COLUMN locked_roster_at timestamptz;
ALTER TABLE public.events ADD COLUMN locked_roster_by uuid REFERENCES auth.users(id);
ALTER TABLE public.events ADD COLUMN academy_callup_player_ids uuid[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN public.events.locked_roster_player_ids IS
  'Players officially rostered for this event. Snapshot taken when operator stamps roster.';
COMMENT ON COLUMN public.events.academy_callup_player_ids IS
  'Academy players called up for this event. Required when locked roster RSVP < 8; optional 8-9.';

-- 15. TOURNAMENTS hotel block (rules already exists with rich schema, not touched)
ALTER TABLE public.tournaments ADD COLUMN hotel_block_info text;
ALTER TABLE public.tournaments ADD COLUMN hotel_block_deadline date;

COMMENT ON COLUMN public.tournaments.hotel_block_info IS
  'Free-text hotel booking details. Renders as Hotel Block content section when present.';

-- 16. INDEXES
CREATE INDEX comms_message_recipients_teams_gin
  ON public.comms_message_recipients USING GIN (teams_included);

CREATE INDEX comms_message_recipients_message_id_idx
  ON public.comms_message_recipients(message_id);

CREATE INDEX comms_message_recipients_created_at_idx
  ON public.comms_message_recipients(created_at);

CREATE INDEX guardians_org_email_partial_idx
  ON public.guardians(org_id, email)
  WHERE email IS NOT NULL;

-- 17. UPDATE get_briefing_queue RPC for new table/column names
CREATE OR REPLACE FUNCTION public.get_briefing_queue(p_org_id uuid)
RETURNS TABLE (
  tournament_id uuid,
  tournament_name text,
  tournament_start_date date,
  tournament_end_date date,
  team_id uuid,
  team_name text,
  team_age_group text,
  team_color text,
  team_sort_order integer,
  event_count bigint,
  sent_history jsonb
)
LANGUAGE sql STABLE SECURITY INVOKER
SET search_path = public, pg_catalog
AS $$
  WITH pairs AS (
    SELECT
      t.id AS tournament_id, t.name AS tournament_name,
      t.start_date AS tournament_start_date, t.end_date AS tournament_end_date,
      tm.id AS team_id, tm.name AS team_name,
      tm.age_group AS team_age_group, tm.team_color AS team_color,
      tm.sort_order AS team_sort_order, COUNT(e.id) AS event_count
    FROM public.tournaments t
    JOIN public.events e ON e.tournament_id = t.id
    JOIN public.teams tm ON tm.id = e.team_id
    WHERE t.org_id = p_org_id AND tm.org_id = p_org_id
      AND t.start_date >= CURRENT_DATE - INTERVAL '14 days'
      AND t.start_date <= CURRENT_DATE + INTERVAL '90 days'
      AND e.status != 'cancelled'
      AND e.publish_status = 'published'
      AND t.archived_at IS NULL
    GROUP BY t.id, t.name, t.start_date, t.end_date,
             tm.id, tm.name, tm.age_group, tm.team_color, tm.sort_order
  ),
  history AS (
    SELECT
      cm.tournament_id, cm.team_id,
      jsonb_agg(jsonb_build_object('kind', cm.kind, 'sent_at', cm.sent_at)
                ORDER BY cm.sent_at DESC) AS sent_history
    FROM public.comms_messages cm
    WHERE cm.org_id = p_org_id
      AND cm.team_id IS NOT NULL
      AND cm.sent_at IS NOT NULL
      AND cm.sent_at > NOW() - INTERVAL '60 days'
    GROUP BY cm.tournament_id, cm.team_id
  )
  SELECT
    p.tournament_id, p.tournament_name, p.tournament_start_date,
    p.tournament_end_date, p.team_id, p.team_name,
    p.team_age_group, p.team_color, p.team_sort_order,
    p.event_count, COALESCE(h.sent_history, '[]'::jsonb) AS sent_history
  FROM pairs p
  LEFT JOIN history h ON h.tournament_id = p.tournament_id AND h.team_id = p.team_id
  ORDER BY p.tournament_start_date ASC, p.team_sort_order DESC NULLS LAST;
$$;

-- 18. Verification block — rolls back the entire transaction if anything fails
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables
                 WHERE table_schema='public' AND table_name='comms_messages') THEN
    RAISE EXCEPTION 'Foundation: comms_messages does not exist';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema='public' AND table_name='tournament_messages') THEN
    RAISE EXCEPTION 'Foundation: tournament_messages still exists';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='comms_messages' AND column_name='message_group_id') THEN
    RAISE EXCEPTION 'Foundation: message_group_id was not dropped';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='comms_messages' AND column_name='custom_header') THEN
    RAISE EXCEPTION 'Foundation: custom_header was not dropped';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema='public' AND table_name='comms_messages' AND column_name='content_sections') THEN
    RAISE EXCEPTION 'Foundation: content_sections was not added';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint
                 WHERE conrelid='public.comms_messages'::regclass
                   AND conname='comms_messages_kind_check') THEN
    RAISE EXCEPTION 'Foundation: kind CHECK constraint did not register';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint
                 WHERE conrelid='public.staff_profiles'::regclass
                   AND contype='p'
                   AND pg_get_constraintdef(oid) ILIKE '%user_id%org_id%') THEN
    RAISE EXCEPTION 'Foundation: staff_profiles composite PK did not register';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables
                 WHERE table_schema='public' AND table_name='org_briefing_contacts') THEN
    RAISE EXCEPTION 'Foundation: org_briefing_contacts not created';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables
                 WHERE table_schema='public' AND table_name='pii_audit_log') THEN
    RAISE EXCEPTION 'Foundation: pii_audit_log not created';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema='public' AND table_name='events' AND column_name='locked_roster_player_ids') THEN
    RAISE EXCEPTION 'Foundation: events.locked_roster_player_ids not added';
  END IF;
END $$;

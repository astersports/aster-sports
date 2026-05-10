-- L99 wave 4.1+4.2 foundation step M4: briefing_templates table
-- Replaces hardcoded JS templates as the primitive. Org-scoped + team-type-scoped + kind-scoped.

CREATE TABLE briefing_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  team_type_id uuid REFERENCES team_types(id) ON DELETE CASCADE,
  kind text NOT NULL,
  slug text NOT NULL,
  name text NOT NULL,
  description text,
  subject_template text NOT NULL,
  body_sections jsonb NOT NULL DEFAULT '[]'::jsonb,
  voice_examples text,
  is_default boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT briefing_templates_kind_check CHECK (kind = ANY (ARRAY[
    'weekly_digest','schedule_change','game_recap','tournament_prelim',
    'tournament_recap','announcement','custom_message','rsvp_nudge',
    'academy_callup_notice'
  ])),
  CONSTRAINT briefing_templates_slug_format_check CHECK (slug ~ '^[a-z0-9_-]+$')
);

CREATE UNIQUE INDEX briefing_templates_org_kind_slug_uniq
  ON briefing_templates(COALESCE(org_id::text, '__system__'), kind, slug);

CREATE INDEX briefing_templates_kind_active_idx
  ON briefing_templates(kind, active) WHERE active = true;
CREATE INDEX briefing_templates_org_idx
  ON briefing_templates(org_id) WHERE org_id IS NOT NULL;
CREATE INDEX briefing_templates_team_type_idx
  ON briefing_templates(team_type_id) WHERE team_type_id IS NOT NULL;

ALTER TABLE briefing_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "briefing_templates_read" ON briefing_templates FOR SELECT
  USING (
    org_id IS NULL
    OR org_id IN (SELECT organization_id FROM user_roles WHERE user_id = auth.uid())
  );

CREATE POLICY "briefing_templates_insert_admin" ON briefing_templates FOR INSERT
  WITH CHECK (org_id IN (
    SELECT organization_id FROM user_roles
    WHERE user_id = auth.uid() AND role IN ('admin','super_admin')
  ));

CREATE POLICY "briefing_templates_update_admin" ON briefing_templates FOR UPDATE
  USING (org_id IN (
    SELECT organization_id FROM user_roles
    WHERE user_id = auth.uid() AND role IN ('admin','super_admin')
  ));

CREATE POLICY "briefing_templates_delete_admin" ON briefing_templates FOR DELETE
  USING (org_id IN (
    SELECT organization_id FROM user_roles
    WHERE user_id = auth.uid() AND role IN ('admin','super_admin')
  ));

COMMENT ON TABLE briefing_templates IS
  'Reusable briefing templates. NULL org_id = system template available to all orgs. NULL team_type_id = applies regardless of team type.';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname='briefing_templates') THEN
    RAISE EXCEPTION 'briefing_templates not created';
  END IF;
  IF (SELECT COUNT(*) FROM pg_policies WHERE tablename='briefing_templates') < 4 THEN
    RAISE EXCEPTION 'briefing_templates RLS policies incomplete';
  END IF;
END $$;

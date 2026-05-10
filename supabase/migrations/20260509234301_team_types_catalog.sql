-- L99 wave 4.1+4.2 foundation step M2: team_types catalog (org-scoped)
-- Enables 5→25 team scaling. Each org configures its team types once; teams inherit defaults.

CREATE TABLE team_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  slug text NOT NULL,
  display_name text NOT NULL,
  description text,
  default_briefing_kinds text[] NOT NULL DEFAULT ARRAY[]::text[],
  default_audience_rules jsonb NOT NULL DEFAULT '{}'::jsonb,
  active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(org_id, slug),
  CONSTRAINT team_types_slug_format_check CHECK (slug ~ '^[a-z0-9_]+$')
);

CREATE INDEX team_types_org_active_idx ON team_types(org_id) WHERE active = true;

ALTER TABLE team_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "team_types_read_org_members" ON team_types FOR SELECT
  USING (org_id IN (SELECT organization_id FROM user_roles WHERE user_id = auth.uid()));

CREATE POLICY "team_types_insert_admin" ON team_types FOR INSERT
  WITH CHECK (org_id IN (
    SELECT organization_id FROM user_roles
    WHERE user_id = auth.uid() AND role IN ('admin','super_admin')
  ));

CREATE POLICY "team_types_update_admin" ON team_types FOR UPDATE
  USING (org_id IN (
    SELECT organization_id FROM user_roles
    WHERE user_id = auth.uid() AND role IN ('admin','super_admin')
  ));

CREATE POLICY "team_types_delete_admin" ON team_types FOR DELETE
  USING (org_id IN (
    SELECT organization_id FROM user_roles
    WHERE user_id = auth.uid() AND role IN ('admin','super_admin')
  ));

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname='team_types' AND relnamespace='public'::regnamespace) THEN
    RAISE EXCEPTION 'team_types table not created';
  END IF;
  IF NOT (SELECT relrowsecurity FROM pg_class WHERE relname='team_types' AND relnamespace='public'::regnamespace) THEN
    RAISE EXCEPTION 'team_types RLS not enabled';
  END IF;
  IF (SELECT COUNT(*) FROM pg_policies WHERE tablename='team_types') < 4 THEN
    RAISE EXCEPTION 'team_types missing policies (expected 4)';
  END IF;
END $$;

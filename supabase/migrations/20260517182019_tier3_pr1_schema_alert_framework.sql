-- Tier 3 v1 PR 1 — Migration A: alert framework + admin home tables
--
-- Creates 4 new tables to support the alert framework and admin home
-- configuration. No data; seed migration is B+C (separate file in
-- this PR per Gap 4 sequencing).
--
-- DECISIONS FROM TIER 3 P0 RESOLUTION (2026-05-16 / 2026-05-17):
--   Gap 1 — aggressive layout for all 3 roles
--   Gap 2 — hybrid alert types with rule-of-two-instances
--   Gap 3 — 8 functional alert configurations (3 deferred)
--   Gap 4 — no org_templates table; hardcode Legacy seeds
--   Gap 5 — 5 new queries supply alert data
--   Gap 6 — GitHub model multi-role (no schema impact here)
--   Gap 7 — no calendar pressure; v1 lands when stable
--   Gap 8 — client-side evaluator with clean seam
--
-- All 4 tables RLS-enabled with policies scoping to current_user_org_id().
-- Read: any authenticated org member. Write: admin only via
-- user_has_role_in_org(org_id, ARRAY['admin']).

-- ─────────────────────────────────────────────────────────────────
-- alert_types — catalog of alert classes (org-agnostic)
-- ─────────────────────────────────────────────────────────────────

CREATE TABLE public.alert_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  default_severity text NOT NULL CHECK (default_severity IN ('critical', 'warning', 'info')),
  description text,
  is_primitive boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.alert_types IS
  'Catalog of alert classes available to the platform. Org-agnostic. Primitives (rsvp_shortfall, briefing_overdue) accept multiple per-org instances via alert_configurations.threshold_config variation. Specifics have a single configuration per org.';

ALTER TABLE public.alert_types ENABLE ROW LEVEL SECURITY;

-- Catalog rows are platform-level. Any authenticated user can read.
CREATE POLICY alert_types_select ON public.alert_types
  FOR SELECT TO authenticated USING (true);

-- Only platform admins manage the catalog. For v1, no INSERT/UPDATE/DELETE
-- policies — catalog is seeded by migration and stable. v2 settings UI
-- (deferred per Gap 4) will introduce admin write paths.

-- ─────────────────────────────────────────────────────────────────
-- alert_configurations — per-org enablement + threshold values
-- ─────────────────────────────────────────────────────────────────

CREATE TABLE public.alert_configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  alert_type_id uuid NOT NULL REFERENCES public.alert_types(id),
  instance_key text,
  enabled boolean NOT NULL DEFAULT true,
  threshold_config jsonb NOT NULL,
  evaluation_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, alert_type_id, instance_key)
);

COMMENT ON COLUMN public.alert_configurations.instance_key IS
  'Per-org disambiguator for primitive alert_types that accept multiple instances. NULL for specific alert types. E.g. rsvp_shortfall + Friday noon vs Saturday 6 AM vs league 24h = 3 rows with different instance_keys.';

COMMENT ON COLUMN public.alert_configurations.threshold_config IS
  'JSONB shape varies by alert_type. Defined per Gap 3 spec. Schema validation deferred to v2 settings UI (Gap 4 sub-decision).';

ALTER TABLE public.alert_configurations ENABLE ROW LEVEL SECURITY;

CREATE POLICY alert_configurations_select ON public.alert_configurations
  FOR SELECT TO authenticated USING (org_id = current_user_org_id());

CREATE POLICY alert_configurations_insert ON public.alert_configurations
  FOR INSERT TO authenticated
  WITH CHECK (user_has_role_in_org(org_id, ARRAY['admin']));

CREATE POLICY alert_configurations_update ON public.alert_configurations
  FOR UPDATE TO authenticated
  USING (user_has_role_in_org(org_id, ARRAY['admin']))
  WITH CHECK (user_has_role_in_org(org_id, ARRAY['admin']));

CREATE POLICY alert_configurations_delete ON public.alert_configurations
  FOR DELETE TO authenticated
  USING (user_has_role_in_org(org_id, ARRAY['admin']));

-- ─────────────────────────────────────────────────────────────────
-- quick_actions_config — per-org quick action tiles for admin home
-- ─────────────────────────────────────────────────────────────────

CREATE TABLE public.quick_actions_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  action_key text NOT NULL,
  label text NOT NULL,
  icon_name text NOT NULL,
  route text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, action_key)
);

COMMENT ON COLUMN public.quick_actions_config.icon_name IS
  'Lucide-react component name (e.g. "CalendarPlus", "UserPlus"). Front-end maps to icon component at render time.';

ALTER TABLE public.quick_actions_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY quick_actions_config_select ON public.quick_actions_config
  FOR SELECT TO authenticated USING (org_id = current_user_org_id());

CREATE POLICY quick_actions_config_insert ON public.quick_actions_config
  FOR INSERT TO authenticated
  WITH CHECK (user_has_role_in_org(org_id, ARRAY['admin']));

CREATE POLICY quick_actions_config_update ON public.quick_actions_config
  FOR UPDATE TO authenticated
  USING (user_has_role_in_org(org_id, ARRAY['admin']))
  WITH CHECK (user_has_role_in_org(org_id, ARRAY['admin']));

CREATE POLICY quick_actions_config_delete ON public.quick_actions_config
  FOR DELETE TO authenticated
  USING (user_has_role_in_org(org_id, ARRAY['admin']));

-- ─────────────────────────────────────────────────────────────────
-- dashboard_section_visibility — per-org section enablement + order
-- ─────────────────────────────────────────────────────────────────

CREATE TABLE public.dashboard_section_visibility (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  section_key text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, section_key)
);

ALTER TABLE public.dashboard_section_visibility ENABLE ROW LEVEL SECURITY;

CREATE POLICY dashboard_section_visibility_select ON public.dashboard_section_visibility
  FOR SELECT TO authenticated USING (org_id = current_user_org_id());

CREATE POLICY dashboard_section_visibility_insert ON public.dashboard_section_visibility
  FOR INSERT TO authenticated
  WITH CHECK (user_has_role_in_org(org_id, ARRAY['admin']));

CREATE POLICY dashboard_section_visibility_update ON public.dashboard_section_visibility
  FOR UPDATE TO authenticated
  USING (user_has_role_in_org(org_id, ARRAY['admin']))
  WITH CHECK (user_has_role_in_org(org_id, ARRAY['admin']));

CREATE POLICY dashboard_section_visibility_delete ON public.dashboard_section_visibility
  FOR DELETE TO authenticated
  USING (user_has_role_in_org(org_id, ARRAY['admin']));

-- ─────────────────────────────────────────────────────────────────
-- Smoke test
-- ─────────────────────────────────────────────────────────────────

DO $$
DECLARE
  v_count int;
BEGIN
  -- Verify all 4 tables exist with RLS enabled
  SELECT count(*) INTO v_count
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relname IN ('alert_types', 'alert_configurations', 'quick_actions_config', 'dashboard_section_visibility')
    AND c.relrowsecurity = true
    AND c.relkind = 'r';
  IF v_count != 4 THEN
    RAISE EXCEPTION 'Tier 3 PR 1 Migration A: expected 4 RLS-enabled tables, got %', v_count;
  END IF;
  RAISE NOTICE 'Tier 3 PR 1 Migration A: 4 tables created with RLS enabled';
END $$;

-- ============================================================
-- 016_user_preferences.sql
--
-- NEW TABLE: per-user-per-org preferences. Drives card density,
-- theme, timezone, locale, notification preferences, quiet hours,
-- and role-specific settings (coach, admin).
--
-- Includes prerequisite: sets user_roles.organization_id NOT NULL
-- since composite PK (user_id, org_id) requires both non-null.
-- Verified April 23, 2026: zero user_roles rows have NULL org_id,
-- so the ALTER COLUMN SET NOT NULL is immediate and safe.
--
-- Architecture decisions (locked April 23, 2026):
--   Q1: Per-user-per-org (composite PK)
--   Q2: Hybrid - structured columns for hot paths, narrow JSONB
--       for extensibility
--   Q3: card_density JSONB with enum CHECK constraint
--   Q4: Users see own rows only. No admin read. Service role for
--       server ops.
--   Q5: Auto-create via trigger on user_roles INSERT
--
-- RLS:
--   SELECT/INSERT/UPDATE: user's own rows only
--   DELETE: blocked for all authenticated users (even the owner)
--   Service role bypasses RLS entirely (Supabase default)
--
-- Backfill: Creates preferences rows for all existing user_roles
-- via ON CONFLICT DO NOTHING (safe to re-run).
--
-- Safe to re-apply: idempotent.
-- ============================================================

BEGIN;

-- ============================================================
-- 0. Prerequisite: user_roles.organization_id NOT NULL
-- Verified zero NULL rows as of April 23, 2026.
-- ============================================================
ALTER TABLE public.user_roles
  ALTER COLUMN organization_id SET NOT NULL;

-- ============================================================
-- 1. Create user_preferences table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_preferences (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

  -- Hot-path structured columns
  theme text NOT NULL DEFAULT 'system',
  timezone text NOT NULL DEFAULT 'America/New_York',
  locale text NOT NULL DEFAULT 'en-US',

  -- Narrow JSONB columns (extensible without migration)
  card_density jsonb NOT NULL DEFAULT '{"default": "medium"}'::jsonb,
  notification_preferences jsonb NOT NULL DEFAULT '{}'::jsonb,
  quiet_hours jsonb NOT NULL DEFAULT '{"weekday": {"start": "21:00", "end": "07:00"}, "weekend": {"start": "22:00", "end": "08:00"}, "overrides": []}'::jsonb,
  role_preferences jsonb NOT NULL DEFAULT '{}'::jsonb,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  PRIMARY KEY (user_id, org_id)
);

COMMENT ON TABLE public.user_preferences IS
  'Per-user-per-org preferences. Auto-created via trigger on user_roles INSERT. Users can SELECT/INSERT/UPDATE their own rows only; DELETE blocked for everyone. Admins have no read access via RLS (privacy default; use service role for support).';

COMMENT ON COLUMN public.user_preferences.theme IS
  'UI theme. Enum: system, light, dark.';

COMMENT ON COLUMN public.user_preferences.timezone IS
  'IANA timezone name for displaying event times in user local time.';

COMMENT ON COLUMN public.user_preferences.card_density IS
  'Card density per card type. Keys: default (fallback), event, next_up, ride, etc. Values: minimal, medium, maximum. App reads card_density[card_type] ?? card_density.default ?? medium.';

COMMENT ON COLUMN public.user_preferences.notification_preferences IS
  'Per-category channel preferences. Keys: schedule_change, rsvp_reminder, volunteer_opportunity, ride_request, briefing, score_published, announcement, chat_mention. Values: {push: bool, email: bool, sms: bool}. Unset keys fall back to org/app defaults.';

COMMENT ON COLUMN public.user_preferences.quiet_hours IS
  'Quiet hours with day-of-week variation. Shape: {weekday: {start, end}, weekend: {start, end}, overrides: [{start_date, end_date, reason}]}. App layer suppresses notifications during quiet windows.';

COMMENT ON COLUMN public.user_preferences.role_preferences IS
  'Role-scoped preferences. Shape: {coach: {...}, admin: {...}}. Parents never touch these keys. Coach keys: rotation_display, auto_publish_scores_after_minutes, share_private_notes_with_assistants. Admin keys: default_landing_page, show_financial_strip.';

-- ============================================================
-- 2. CHECK constraints
-- ============================================================

-- theme must be a known enum value
ALTER TABLE public.user_preferences
  ADD CONSTRAINT user_preferences_theme_enum
  CHECK (theme IN ('system', 'light', 'dark'));

-- card_density must be object AND all values must be in the density enum
-- (uses jsonb_path_exists single expression, no subquery)
ALTER TABLE public.user_preferences
  ADD CONSTRAINT user_preferences_card_density_valid
  CHECK (
    jsonb_typeof(card_density) = 'object'
    AND NOT jsonb_path_exists(
      card_density,
      '$.* ? (@ != "minimal" && @ != "medium" && @ != "maximum")'
    )
  );

-- notification_preferences must be object (shape only)
ALTER TABLE public.user_preferences
  ADD CONSTRAINT user_preferences_notification_preferences_is_object
  CHECK (jsonb_typeof(notification_preferences) = 'object');

-- quiet_hours must be object (shape only)
ALTER TABLE public.user_preferences
  ADD CONSTRAINT user_preferences_quiet_hours_is_object
  CHECK (jsonb_typeof(quiet_hours) = 'object');

-- role_preferences must be object (shape only)
ALTER TABLE public.user_preferences
  ADD CONSTRAINT user_preferences_role_preferences_is_object
  CHECK (jsonb_typeof(role_preferences) = 'object');

-- ============================================================
-- 3. Indexes
-- ============================================================

-- GIN on notification_preferences (future: find users who want push for category X)
CREATE INDEX IF NOT EXISTS idx_user_preferences_notification_prefs_gin
  ON public.user_preferences USING gin (notification_preferences);

-- Index on org_id for admin dashboards / per-org analytics
CREATE INDEX IF NOT EXISTS idx_user_preferences_org_id
  ON public.user_preferences (org_id);

-- ============================================================
-- 4. updated_at trigger
-- ============================================================
CREATE OR REPLACE FUNCTION public.user_preferences_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_user_preferences_updated_at ON public.user_preferences;

CREATE TRIGGER trg_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.user_preferences_set_updated_at();

-- ============================================================
-- 5. Auto-create trigger on user_roles INSERT
-- ============================================================
CREATE OR REPLACE FUNCTION public.user_roles_create_preferences()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_preferences (user_id, org_id)
  VALUES (NEW.user_id, NEW.organization_id)
  ON CONFLICT (user_id, org_id) DO NOTHING;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.user_roles_create_preferences IS
  'Auto-creates user_preferences row on user_roles INSERT. SECURITY DEFINER + search_path hardening prevents privilege escalation. ON CONFLICT DO NOTHING makes it safe for reassignments.';

DROP TRIGGER IF EXISTS trg_user_roles_create_preferences ON public.user_roles;

CREATE TRIGGER trg_user_roles_create_preferences
  AFTER INSERT ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.user_roles_create_preferences();

-- ============================================================
-- 6. Backfill: create preferences for existing user_roles
-- Safe via ON CONFLICT, idempotent
-- ============================================================
INSERT INTO public.user_preferences (user_id, org_id)
SELECT DISTINCT user_id, organization_id
FROM public.user_roles
WHERE organization_id IS NOT NULL
ON CONFLICT (user_id, org_id) DO NOTHING;

-- ============================================================
-- 7. RLS
-- ============================================================
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies in case of re-apply
DROP POLICY IF EXISTS "user_preferences_select_own" ON public.user_preferences;
DROP POLICY IF EXISTS "user_preferences_insert_own" ON public.user_preferences;
DROP POLICY IF EXISTS "user_preferences_update_own" ON public.user_preferences;
DROP POLICY IF EXISTS "user_preferences_delete_blocked" ON public.user_preferences;

-- SELECT own rows only
CREATE POLICY "user_preferences_select_own" ON public.user_preferences
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- INSERT own rows only (trigger also creates them, but this allows manual upsert)
CREATE POLICY "user_preferences_insert_own" ON public.user_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- UPDATE own rows only
CREATE POLICY "user_preferences_update_own" ON public.user_preferences
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- DELETE blocked for everyone (preferences reset via UPDATE, never DELETE)
CREATE POLICY "user_preferences_delete_blocked" ON public.user_preferences
  FOR DELETE
  TO authenticated
  USING (false);

-- ============================================================
-- 8. Reload PostgREST schema cache
-- ============================================================
NOTIFY pgrst, 'reload schema';

COMMIT;

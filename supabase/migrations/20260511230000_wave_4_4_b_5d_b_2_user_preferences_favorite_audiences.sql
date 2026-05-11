-- Wave 4.4-B Session 5d-b-2: favorite_audiences JSONB column
-- on user_preferences. Stores admin-saved audience presets for
-- one-tap re-apply in the briefing wizard (Step 2). Portable
-- audience types only: org_all, team, multi_team.
--
-- Shape: array of objects, each:
--   { id: uuid, label: text, audience_type: text,
--     audience_filter: jsonb, created_at: timestamptz }
-- Default '[]' so existing 5 rows backfill atomically.

ALTER TABLE public.user_preferences
  ADD COLUMN IF NOT EXISTS favorite_audiences jsonb
  NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.user_preferences.favorite_audiences IS
  'Wave 4.4-B Session 5d-b-2. Admin-saved audience presets for the briefing wizard. JSONB array of {id, label, audience_type, audience_filter, created_at}. Portable types only: org_all/team/multi_team.';

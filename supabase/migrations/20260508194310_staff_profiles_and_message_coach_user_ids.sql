-- 20260508194310_staff_profiles_and_message_coach_user_ids.sql
-- Mirror of production migration applied via Supabase MCP on May 8, 2026.
--
-- Adds two pieces required by the coach-contact-in-briefings flow:
--
-- 1. public.staff_profiles — per-user contact data shown in parent-facing
--    briefings. user_id is PK; users self-edit their own row. Display name
--    overrides the auth.users.full_name in emails (e.g. "Coach Kenny" not
--    "Kenneth Lane"); phone goes in the contact footer.
--
-- 2. public.tournament_messages.coach_user_ids uuid[] — captures which
--    coaches were credited as contacts for each send, even if team_staff
--    later changes. Resolved against staff_profiles at render time.
--
-- No seed rows. Frank/Kenny/Darien populate their own profiles via a
-- future settings UI; until then the contact footer is hidden when
-- coach_user_ids is empty/null.

CREATE TABLE public.staff_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  phone text,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.staff_profiles IS
  'Staff user profile for parent-facing surfaces. display_name overrides auth.users.full_name in tournament briefing emails. phone is shown in the contact footer.';

ALTER TABLE public.staff_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY staff_profiles_select_authenticated ON public.staff_profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY staff_profiles_insert_own ON public.staff_profiles
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY staff_profiles_update_own ON public.staff_profiles
  FOR UPDATE TO authenticated USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

GRANT SELECT, INSERT, UPDATE ON public.staff_profiles TO authenticated;
GRANT ALL ON public.staff_profiles TO service_role;

ALTER TABLE public.tournament_messages
  ADD COLUMN coach_user_ids uuid[];

COMMENT ON COLUMN public.tournament_messages.coach_user_ids IS
  'auth.users ids of coaches whose names + phones rendered in this briefing''s contact footer at send time. NULL/empty if no coaches were attached.';

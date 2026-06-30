-- Account-synced "tracked teams" for the no-login AAU Hub (R1·PR-A, DR-P sync).
-- An anon parent's followed teams live in localStorage; once they sign in via the
-- Hub magic link, their list persists here on their user id and follows them
-- across devices. team_key is the qkey (name:gender:grade) the schedule route +
-- search + bracket RPCs all resolve on. Keyed to auth.users — no org context
-- (the Hub is cross-org), so this is NOT one of the org-scoped tables.
CREATE TABLE IF NOT EXISTS public.tracked_aau_teams (
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  team_key   text NOT NULL,
  team_name  text,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, team_key)
);

ALTER TABLE public.tracked_aau_teams ENABLE ROW LEVEL SECURITY;

-- A user reads/writes ONLY their own tracked rows. auth.uid() is subselect-wrapped
-- so the planner evaluates it once per query (initplan), per the §5 RLS pattern.
-- track/untrack is insert/delete only — no UPDATE policy (nothing mutable but the
-- composite key itself).
CREATE POLICY tracked_aau_teams_select ON public.tracked_aau_teams
  FOR SELECT USING (user_id = (SELECT auth.uid()));
CREATE POLICY tracked_aau_teams_insert ON public.tracked_aau_teams
  FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY tracked_aau_teams_delete ON public.tracked_aau_teams
  FOR DELETE USING (user_id = (SELECT auth.uid()));

-- Lock the grant chain. Supabase default privileges auto-grant the FULL set
-- (incl. UPDATE + TRUNCATE, which RLS does NOT gate for TRUNCATE) to the
-- `authenticated` role on every new public table — the table-level analog of
-- AP #57. REVOKE ALL first, then grant back exactly SELECT/INSERT/DELETE. Anon
-- gets nothing (anon parents stay on localStorage).
REVOKE ALL ON public.tracked_aau_teams FROM PUBLIC;
REVOKE ALL ON public.tracked_aau_teams FROM anon;
REVOKE ALL ON public.tracked_aau_teams FROM authenticated;
GRANT SELECT, INSERT, DELETE ON public.tracked_aau_teams TO authenticated;

COMMENT ON TABLE public.tracked_aau_teams IS
  'Account-synced tracked teams for the no-login AAU Hub. user_id -> auth.users; team_key is the qkey. RLS: own rows only. Anon parents use localStorage; this is the cross-device sync home once they sign in via the Hub magic link.';

-- Roster visibility full build (architect RULINGS_ROSTER_VISIBILITY_AND_FUNNEL_SELECT
-- RV-2): a per-TEAM 3-state override on top of the program default. NULL = inherit
-- the program; true = Show; false = Hide. The teammate fn reads the team override
-- FIRST, then the program, then the program_type default. Effective =
-- COALESCE(team.override, program.roster_visibility, program_type='season', true).
ALTER TABLE public.teams
  ADD COLUMN IF NOT EXISTS roster_visibility_override boolean;
COMMENT ON COLUMN public.teams.roster_visibility_override IS
  'Per-team roster visibility override. NULL = inherit the program (programs.roster_visibility / type default); true = show this team''s roster to other families; false = hide. Read by current_user_teammate_player_ids(); set in team setup (TeamFormSheet).';

CREATE OR REPLACE FUNCTION public.current_user_teammate_player_ids()
RETURNS uuid[]
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT COALESCE(ARRAY_AGG(DISTINCT rm.player_id), ARRAY[]::uuid[])
  FROM roster_members rm
  JOIN teams t ON t.id = rm.team_id
  LEFT JOIN programs pr ON pr.id = t.season_id
  WHERE rm.team_id = ANY (current_user_child_team_ids())
    AND COALESCE(t.roster_visibility_override, pr.roster_visibility, pr.program_type = 'season', true) = true;
$$;

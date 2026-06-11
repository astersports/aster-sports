-- Roster visibility (fast-track privacy mitigation). A team's roster is shown
-- to OTHER families only when its program's roster_visibility is true.
-- Operator-directed (2026-06-11): tryouts/camps hide the roster, season teams
-- show it ("tryouts no, camp maybe, team yes"; camp default = hidden). This is
-- the RLS-enforced half (RV-1/RV-3 of ARCHITECT_DECISION_REQUEST_ROSTER_
-- VISIBILITY); the team-level override + admin toggle UI follow the architect's
-- render. Privacy-tightening + reversible.

ALTER TABLE public.programs
  ADD COLUMN IF NOT EXISTS roster_visibility boolean;
COMMENT ON COLUMN public.programs.roster_visibility IS
  'When true, this program''s team rosters are visible to other families (teammate visibility). NULL = default by program_type (season visible, tryout/camp hidden). Set by admin program setup (UI pending architect render per ARCHITECT_DECISION_REQUEST_ROSTER_VISIBILITY_2026-06-11).';

-- Backfill existing programs by type: season visible, tryout/camp hidden.
UPDATE public.programs
SET roster_visibility = (program_type = 'season')
WHERE roster_visibility IS NULL;

-- Teammate visibility now respects program roster_visibility. Own children stay
-- visible via players_select_parent; staff via players_select_staff; only the
-- parent teammate path (players_select_parent_team) narrows. NULL roster_visibility
-- falls back to the by-type default so newly-created programs are privacy-correct
-- before the admin UI lands.
CREATE OR REPLACE FUNCTION public.current_user_teammate_player_ids()
RETURNS uuid[]
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT COALESCE(ARRAY_AGG(DISTINCT rm.player_id), ARRAY[]::uuid[])
  FROM roster_members rm
  JOIN teams t ON t.id = rm.team_id
  LEFT JOIN programs pr ON pr.id = t.season_id
  WHERE rm.team_id = ANY (current_user_child_team_ids())
    AND COALESCE(pr.roster_visibility, pr.program_type = 'season', true) = true;
$$;

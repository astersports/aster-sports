// Pure: the effective roster visibility for a team, mirroring the
// current_user_teammate_player_ids() COALESCE chain
//   COALESCE(team.override, program.roster_visibility, program_type='season', true).
// true = this team's roster is visible to OTHER families; false = hidden.
// Keep in lockstep with the SQL fn (teams_roster_visibility_override migration).
export function rosterVisible(teamOverride, programVisibility, programType) {
  if (teamOverride != null) return teamOverride;
  if (programVisibility != null) return programVisibility;
  return programType === 'season';
}

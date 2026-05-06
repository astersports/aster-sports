import { supabase } from './supabase';

// Seeds tournament_rosters with active (non-Futures) players from each team.
// Called after adding teams to a tournament. Extracted from useTournaments
// to keep the hook under the 150-line cap.
export async function seedRosters(tournamentId, teamIds) {
  for (const teamId of teamIds) {
    const { data: roster } = await supabase
      .from('team_players')
      .select('player_id')
      .eq('team_id', teamId)
      .eq('status', 'active')
      .eq('roster_type', 'rostered');
    if (!roster?.length) continue;
    const rows = roster.map((rm) => ({
      tournament_id: tournamentId,
      team_id: teamId,
      player_id: rm.player_id,
      roster_status: 'active',
    }));
    await supabase.from('tournament_rosters').insert(rows);
  }
}

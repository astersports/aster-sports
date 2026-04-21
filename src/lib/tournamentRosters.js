import { supabase } from './supabase';

// Seeds tournament_rosters with active (non-Futures) players from each team.
// Called after adding teams to a tournament. Extracted from useTournaments
// to keep the hook under the 150-line cap.
export async function seedRosters(tournamentId, teamIds) {
  for (const teamId of teamIds) {
    const { data: roster } = await supabase
      .from('roster_members')
      .select('player_id, players!inner(id, member_type)')
      .eq('team_id', teamId)
      .eq('players.member_type', 'roster');
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

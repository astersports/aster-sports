import { supabase } from './supabase';

// Seeds tournament_rosters with active (non-Futures) players from each team.
// Called after adding teams to a tournament. Extracted from useTournaments
// to keep the hook under the 150-line cap.
export async function seedRosters(tournamentId, teamIds) {
  for (const teamId of teamIds) {
    // AP #36: a swallowed read error here silently drops the team from the
    // canonical tournament-audience seed → those kids miss every tournament
    // briefing. Surface the error rather than treating it as "empty roster".
    const { data: roster, error: rosterErr } = await supabase
      .from('team_players')
      .select('player_id')
      .eq('team_id', teamId)
      .eq('status', 'active')
      .eq('roster_type', 'rostered');
    if (rosterErr) throw new Error(`Could not load roster for team ${teamId}: ${rosterErr.message}`);
    if (!roster?.length) continue;
    const rows = roster.map((rm) => ({
      tournament_id: tournamentId,
      team_id: teamId,
      player_id: rm.player_id,
      roster_status: 'active',
    }));
    const { error: insertErr } = await supabase.from('tournament_rosters').insert(rows);
    if (insertErr) throw new Error(`Could not seed tournament roster for team ${teamId}: ${insertErr.message}`);
  }
}

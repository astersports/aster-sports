import { supabase } from './supabase';

// Fetches a parent's linked children and the teams they're rostered to.
// Used to scope the schedule, messaging, and RSVPs to a parent's kids.
// Returns empty arrays when no guardian row exists or the user has no
// linked players yet — callers can treat the empty result as "no scope".
export async function fetchParentContext(userId) {
  if (!userId) return { myChildren: [], myTeamIds: [] };

  const { data: guardian, error: gErr } = await supabase
    .from('guardians')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();
  if (gErr || !guardian) return { myChildren: [], myTeamIds: [] };

  const { data: links, error: lErr } = await supabase
    .from('player_guardians')
    .select('player_id, players!inner(id, first_name, last_name, roster_members!inner(team_id))')
    .eq('guardian_id', guardian.id);
  if (lErr || !links) return { myChildren: [], myTeamIds: [] };

  const myChildren = [];
  const teamIdSet = new Set();
  for (const link of links) {
    const p = link.players;
    if (!p) continue;
    const rosters = p.roster_members || [];
    for (const rm of rosters) {
      if (rm.team_id) teamIdSet.add(rm.team_id);
    }
    myChildren.push({
      playerId: p.id,
      firstName: p.first_name,
      lastName: p.last_name,
      teamId: rosters[0]?.team_id ?? null,
    });
  }
  return { myChildren, myTeamIds: [...teamIdSet] };
}

import { supabase } from './supabase';

// Fetches a parent's linked children and the teams they're rostered to
// in a single round-trip. Nested select: guardian -> player_guardians ->
// players -> roster_members. Replaces a two-query chain used to cold-open
// the parent dashboard.
// Returns empty arrays when no guardian row exists or the user has no
// linked players yet — callers can treat the empty result as "no scope".
export async function fetchParentContext(userId) {
  const empty = { myChildren: [], myTeamIds: [], guardianId: null, guardianFirstName: null };
  if (!userId) return empty;

  const { data: guardian, error } = await supabase
    .from('guardians')
    .select('id, first_name, player_guardians(player_id, players(id, first_name, last_name, roster_members(team_id, left_at)))')
    .eq('user_id', userId)
    .maybeSingle();
  if (error || !guardian) return empty;

  const myChildren = [];
  const teamIdSet = new Set();
  for (const link of guardian.player_guardians || []) {
    const p = link.players;
    if (!p) continue;
    const activeRosters = (p.roster_members || []).filter((rm) => rm.team_id && rm.left_at === null);
    const teamIds = activeRosters.map((rm) => rm.team_id);
    teamIds.forEach((id) => teamIdSet.add(id));
    myChildren.push({
      playerId: p.id,
      firstName: p.first_name,
      lastName: p.last_name,
      teamId: teamIds[0] ?? null,
      teamIds,
    });
  }
  return {
    myChildren,
    myTeamIds: [...teamIdSet],
    guardianId: guardian.id,
    guardianFirstName: guardian.first_name ?? null,
  };
}

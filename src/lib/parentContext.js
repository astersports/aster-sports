import { supabase } from './supabase';

// Reads parent_context_v — the canonical single-query source for a
// parent's children + active team memberships. The view joins guardians →
// player_guardians → players → team_players (active only) → teams,
// filtering by g.user_id IS NOT NULL. Returns empty when no guardian
// row exists or the user has no linked active-roster players.
export async function fetchParentContext(userId) {
  const empty = { myChildren: [], myTeamIds: [], guardianId: null, guardianFirstName: null };
  if (!userId) return empty;

  const { data, error } = await supabase
    .from('parent_context_v')
    .select('guardian_id, player_id, player_first_name, player_last_name, team_id')
    .eq('user_id', userId);
  if (error || !data?.length) {
    if (error) console.error('fetchParentContext:', error.message);
    return empty;
  }

  const distinctGuardianIds = [...new Set(data.map((r) => r.guardian_id))];
  if (distinctGuardianIds.length > 1) {
    console.error('[parentContext] multiple guardian_ids for user', userId, distinctGuardianIds);
  }
  const guardianId = data[0].guardian_id;
  const { data: gRow, error: gErr } = await supabase
    .from('guardians').select('first_name').eq('id', guardianId).maybeSingle();
  if (gErr) console.error('[parentContext] guardians:', gErr.message);

  const childMap = new Map();
  const teamIdSet = new Set();
  for (const row of data) {
    teamIdSet.add(row.team_id);
    if (!childMap.has(row.player_id)) {
      childMap.set(row.player_id, {
        playerId: row.player_id,
        firstName: row.player_first_name,
        lastName: row.player_last_name,
        teamIds: [],
      });
    }
    childMap.get(row.player_id).teamIds.push(row.team_id);
  }

  const playerIds = [...childMap.keys()];
  if (playerIds.length > 0) {
    const { data: types, error: typesErr } = await supabase
      .from('players').select('id, member_type')
      .in('id', playerIds);
    if (typesErr) console.error('[parentContext] players member_type:', typesErr.message);
    (types || []).forEach((t) => {
      const child = childMap.get(t.id);
      if (child) child.memberType = t.member_type;
    });
  }

  const myChildren = [...childMap.values()].map((c) => ({
    ...c,
    teamId: c.teamIds[0] ?? null,
  }));

  return {
    myChildren,
    myTeamIds: [...teamIdSet],
    guardianId,
    guardianFirstName: gRow?.first_name ?? null,
  };
}

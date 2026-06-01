// Tier 3 v1 PR 5 — adapter from ParentHomePage shape to the
// kidsWithEvents shape detectConflicts expects.
//
// detectConflicts (familyGuideHelpers.js) was built for the
// family_guide briefing resolver, where kids carry teams + the
// resolver pre-groups events per team block. ParentHomePage has
// myChildren (flat list) + activities (flat list) + a myTeams
// strip. This adapter bridges them without duplicating
// detectConflicts logic.
//
// Output shape per block (matches familyGuideHelpers contract):
//   { player_id, first_name, team_id, team_name, team_color,
//     sort_order, events: [...] }
//
// One block per kid×team. A kid on two teams produces two blocks
// (same as family_guide resolver). detectConflicts iterates blocks
// and pairs events across different player_ids.

export function toKidsWithEvents(myChildren, activities, teamsById) {
  const out = [];
  const events = activities || [];
  for (const k of myChildren || []) {
    const teamIds = k.teamIds?.length ? k.teamIds : (k.teamId ? [k.teamId] : []);
    for (const teamId of teamIds) {
      const team = teamsById?.[teamId];
      out.push({
        player_id: k.playerId,
        first_name: k.firstName,
        team_id: teamId,
        team_name: team?.name || '—',
        team_color: team?.team_color || 'var(--as-neutral)',
        sort_order: team?.sort_order ?? 999,
        events: events.filter((a) => a.team_id === teamId && a.status !== 'cancelled' && a.start_at),
      });
    }
  }
  return out;
}

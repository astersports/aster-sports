// Family Guide — coach fetch + grouping helpers. The grouping helpers
// (buildTeamCoaches, flattenCoaches) are pure (no IO). fetchTeamCoaches
// does the IO but takes the supabase client INJECTED (AP #27 — no
// top-level supabase import), so the module stays test-loadable.
//
// The resolver fetches team_staff joined to teams + staff_profiles for the
// parent's kids' teams; these helpers shape that flat row set into:
//   (a) teamCoaches — per-team groups for the "Your coaches" reference
//       block, deduped within each team and deduped across kids (a parent
//       with two kids on the same team sees that team once).
//   (b) flatCoaches — the de-duplicated coach list the signoff renders
//       (name · title · phone), so coaches surface once in the signoff
//       regardless of how many teams they staff.
//
// No fabrication (AP #27): a coach row with no display_name OR no phone is
// dropped. A team with zero valid coaches is omitted from teamCoaches.
// Team order follows the team's sort_order (oldest-to-youngest per §10).

// Fetch the per-team coach groups + flat signoff list for a parent's kids'
// teams. Joins team_staff (scoped to teamIds) to staff_profiles by user_id
// in JS — staff_profiles has no FK from team_staff, so a PostgREST embed
// isn't available. AP #36 — destructure error and throw before using data.
// Returns { teamCoaches: [], coaches: [] } when there are no teams.
export async function fetchTeamCoaches(supabase, { orgId, teamIds } = {}) {
  if (!orgId || !(teamIds || []).length) return { teamCoaches: [], coaches: [] };
  const [{ data: tsRows, error: tsErr }, { data: spRows, error: spErr }] = await Promise.all([
    supabase.from('team_staff')
      .select('team_id, user_id, teams ( name, sort_order )').in('team_id', teamIds),
    supabase.from('staff_profiles')
      .select('user_id, display_name, title, phone').eq('org_id', orgId).not('display_name', 'is', null),
  ]);
  if (tsErr) throw tsErr;
  if (spErr) throw spErr;
  const profByUser = new Map((spRows || []).map((p) => [p.user_id, p]));
  const flatRows = (tsRows || []).map((r) => {
    const p = profByUser.get(r.user_id) || {};
    return {
      team_id: r.team_id,
      team_name: r.teams?.name || 'Team',
      sort_order: r.teams?.sort_order ?? 0,
      display_name: p.display_name || '',
      title: p.title || '',
      phone: p.phone || '',
    };
  });
  const teamCoaches = buildTeamCoaches(flatRows);
  return { teamCoaches, coaches: flattenCoaches(teamCoaches) };
}

// Build the per-team coach groups for the coaches_block section.
// rows: { team_id, team_name, sort_order, display_name, title, phone }.
export function buildTeamCoaches(rows) {
  const byTeam = new Map();
  for (const r of rows || []) {
    if (!r?.team_id) continue;
    if (!r.display_name || !r.phone) continue;
    if (!byTeam.has(r.team_id)) {
      byTeam.set(r.team_id, {
        team_id: r.team_id,
        team_name: r.team_name || 'Team',
        sort_order: r.sort_order ?? 0,
        coaches: [],
        _seen: new Set(),
      });
    }
    const group = byTeam.get(r.team_id);
    const key = `${r.display_name}|${r.phone}`;
    if (group._seen.has(key)) continue;
    group._seen.add(key);
    group.coaches.push({ display_name: r.display_name, title: r.title || '', phone: r.phone });
  }
  return [...byTeam.values()]
    .filter((g) => g.coaches.length)
    .sort((a, b) => (a.sort_order - b.sort_order) || a.team_name.localeCompare(b.team_name))
    .map(({ _seen, ...g }) => g);
}

// Flatten teamCoaches into the de-duplicated signoff list (one row per
// distinct name+phone across all teams).
export function flattenCoaches(teamCoaches) {
  const seen = new Set();
  const out = [];
  for (const g of teamCoaches || []) {
    for (const c of g.coaches || []) {
      const key = `${c.display_name}|${c.phone}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ display_name: c.display_name, title: c.title || '', phone: c.phone });
    }
  }
  return out;
}

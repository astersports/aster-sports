// Wave 4.1d-4 — pure inbox-row client-side filter helpers, extracted
// from ActiveQueue.jsx so tests can import without pulling the React
// tree. Default-deny on the team branch closes the bug class where
// synth rows fell through `return true` and bypassed the chip filter.
//
// Row shapes that team-pass:
//   anchor_kind === 'org'           — always (org-wide, e.g. weekly digest)
//   audience_filter.team_ids        — DB-backed multi_team rows
//   team_ids[]                      — synth tournament rows
//   team_id                         — synth game/skipped rows
//   anchor_kind === 'team'          — DB-backed team-anchored rows
//   default                         — DENY (hide, don't leak)

export function rowMatchesTeamFilter(r, teamFilter) {
  if (!teamFilter?.length) return true;
  if (r.anchor_kind === 'org') return true;
  if (r.audience_filter?.team_ids) return r.audience_filter.team_ids.some((t) => teamFilter.includes(t));
  if (r.team_ids?.length) return r.team_ids.some((t) => teamFilter.includes(t));
  if (r.team_id) return teamFilter.includes(r.team_id);
  if (r.anchor_kind === 'team') return teamFilter.includes(r.anchor_id);
  return false;
}

export function applyClientFilters(rows, filters, search) {
  let out = rows;
  if (filters?.kind) out = out.filter((r) => r.kind === filters.kind);
  if (filters?.teams?.length) out = out.filter((r) => rowMatchesTeamFilter(r, filters.teams));
  if (search?.trim()) {
    const q = search.trim().toLowerCase();
    out = out.filter((r) => (r.title || r.subject || '').toLowerCase().includes(q));
  }
  return out;
}

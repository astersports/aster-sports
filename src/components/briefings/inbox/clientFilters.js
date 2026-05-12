// Wave 4.8 6c Session 3 — client-side filtering reduced to search only.
// kind + teams + dateRange now flow as RPC params to briefing_active_queue
// (PR #120) so the partial-implementation bug from the 6a audit (chip set
// but no server-side application) closes server-side. Search stays
// client-side because the RPC has no full-text index on title/subject yet.
//
// rowMatchesTeamFilter is preserved (still exported) for use against the
// safety-net rows from useNeedsBriefing — those don't flow through the
// RPC, and a kind/teams filter applied to the RPC path leaves the
// safety-net rows untouched.

export function rowMatchesTeamFilter(r, teamFilter) {
  if (!teamFilter?.length) return true;
  if (r.anchor_kind === 'org') return true;
  if (r.audience_filter?.team_ids) return r.audience_filter.team_ids.some((t) => teamFilter.includes(t));
  if (r.team_ids?.length) return r.team_ids.some((t) => teamFilter.includes(t));
  if (r.team_id) return teamFilter.includes(r.team_id);
  if (r.anchor_kind === 'team') return teamFilter.includes(r.anchor_id);
  return false;
}

export function applyClientFilters(rows, _filters, search) {
  if (!search?.trim()) return rows;
  const q = search.trim().toLowerCase();
  return rows.filter((r) => (r.title || r.title_text || r.subject || '').toLowerCase().includes(q));
}

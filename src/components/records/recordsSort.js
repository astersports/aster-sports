// Records sort/filter helpers — pure, shared by RecordsControls (UI) and
// RecordsTeamList (apply). Kept tiny + side-effect-free so the list and the
// control row never derive ordering from different logic (AP #63).

// Parse the "W-L" / "W-L-T" record string back to numbers for tiebreaks.
function parseRecord(rec) {
  const [w = 0, l = 0] = String(rec || '0-0').split('-').map((n) => Number(n) || 0);
  return { w, l };
}

// Sort options surfaced in the control row. `key` is the stable id stored in
// state; `label` is the human label (ALL CAPS handled by the eyebrow style).
export const RECORDS_SORT_OPTIONS = [
  { key: 'default', label: 'Roster Order' },
  { key: 'wins', label: 'Most Wins' },
  { key: 'winPct', label: 'Win %' },
  { key: 'diff', label: 'Point Diff' },
];

// Filter chips — null filter = all teams. Circuit values come from the DB
// (team.circuit); labels follow the records naming rules ("League Play",
// never "CYO"). Counts are computed at render so empty circuits hide.
export const RECORDS_FILTERS = [
  { key: 'all', label: 'All', match: () => true },
  { key: 'aau', label: 'AAU', match: (t) => t.circuit === 'aau' },
  { key: 'league_play', label: 'League Play', match: (t) => t.circuit === 'league_play' },
];

export function applyRecordsView(teams, summaryFor, { sort, filter }) {
  const matcher = (RECORDS_FILTERS.find((f) => f.key === filter) || RECORDS_FILTERS[0]).match;
  const filtered = teams.filter(matcher);
  if (sort === 'default') return filtered;
  const sorted = [...filtered].sort((a, b) => {
    const sa = summaryFor(a.id);
    const sb = summaryFor(b.id);
    if (sort === 'wins') return parseRecord(sb.record).w - parseRecord(sa.record).w;
    if (sort === 'winPct') return (sb.winPct || 0) - (sa.winPct || 0);
    if (sort === 'diff') return (sb.diff || 0) - (sa.diff || 0);
    return 0;
  });
  return sorted;
}

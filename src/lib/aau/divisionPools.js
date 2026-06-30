// Group a division's teams by pool / sub-division for the no-login Hub (R1·PR-A).
// Pure (AP #27). A tournament division (gender/grade) splits into pools — e.g.
// "National Orange" + "One Day Only" — and standings are per-pool, never merged
// into one cross-pool ranking. The teams arrive already ordered (wins desc within
// the division); we keep that order inside each pool and preserve first-seen pool
// order so the grouping is stable. Teams with no pool collapse into one trailing
// unlabelled group (pool: null).

export function groupTeamsByPool(teams) {
  const groups = [];
  const idx = new Map(); // pool key -> index in groups
  for (const tm of teams || []) {
    const key = tm?.pool || '';
    if (!idx.has(key)) {
      idx.set(key, groups.length);
      groups.push({ pool: tm?.pool || null, teams: [] });
    }
    groups[idx.get(key)].teams.push(tm);
  }
  return groups;
}

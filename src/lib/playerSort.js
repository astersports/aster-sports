// 2026-05-21 — Canonical player sort impl. Single source of truth for
// player ordering across surfaces. Consumers:
//   1. src/hooks/useFilteredRoster.js   (RosterSection)
//   2. src/components/gameday/TeamHeatmap.jsx (Pulse grid rows)
//
// Per anti-pattern #42 (parallel-system buildup): PR #423 introduced two
// parallel sort impls (TeamHeatmap.sortByOrder + usePlayerSortOrder
// identity-function sortPlayers) alongside useFilteredRoster's existing
// sort. This helper consolidates them. If a third surface needs a sort
// variant, add a sortOrder branch here — do NOT re-introduce inline sort.
//
// sortOrder values: 'jersey' (default) | 'name' | 'grade' | 'age' | 'attendance'
// Null jerseys always sink to the bottom of the jersey sort.
//
// `getPlayer` accessor lets TeamHeatmap pass grid rows ({ player, pct, ... })
// while RosterSection passes player objects directly. Default is identity.
// `getAttendancePct` accessor lets TeamHeatmap use its precomputed row.pct
// while RosterSection falls back to the goingCount/totalPast computation.

const defaultGetPlayer = (item) => item;
const defaultGetAttendancePct = (item) => {
  const p = item.player || item;
  return p.attendance_pct ?? (p.totalPast > 0 ? (p.goingCount || 0) / p.totalPast : -1);
};

export function sortPlayersByOrder(items, sortOrder, options = {}) {
  const getPlayer = options.getPlayer || defaultGetPlayer;
  const getAttendancePct = options.getAttendancePct || defaultGetAttendancePct;

  return [...items].sort((a, b) => {
    const pa = getPlayer(a);
    const pb = getPlayer(b);

    if (sortOrder === 'name') {
      const c = (pa.last_name || '').localeCompare(pb.last_name || '');
      return c !== 0 ? c : (pa.first_name || '').localeCompare(pb.first_name || '');
    }
    if (sortOrder === 'grade') return (pa.grade || 0) - (pb.grade || 0);
    if (sortOrder === 'age') {
      const aD = pa.dob ? new Date(pa.dob).getTime() : Infinity;
      const bD = pb.dob ? new Date(pb.dob).getTime() : Infinity;
      return aD - bD;
    }
    if (sortOrder === 'attendance') {
      return getAttendancePct(b) - getAttendancePct(a);
    }
    // 'jersey' (default)
    const aJ = pa.jersey_number != null ? parseInt(pa.jersey_number, 10) : NaN;
    const bJ = pb.jersey_number != null ? parseInt(pb.jersey_number, 10) : NaN;
    if (isNaN(aJ) && isNaN(bJ)) return 0;
    if (isNaN(aJ)) return 1;
    if (isNaN(bJ)) return -1;
    return aJ - bJ;
  });
}

import { useMemo } from 'react';

// Filters a player list by a search query (first/last name + jersey)
// and sorts by the selected key. Memoized so the result is stable
// across re-renders unless inputs change.
//
// sortBy values: 'jersey' (default) | 'name' | 'grade' | 'age'
// Null jerseys always sink to the bottom of the jersey sort.
export function useFilteredRoster(players, search, sortBy) {
  return useMemo(() => {
    const filtered = players.filter((p) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        (p.first_name || '').toLowerCase().includes(q) ||
        (p.last_name || '').toLowerCase().includes(q) ||
        String(p.jersey_number ?? '').includes(q)
      );
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === 'name') {
        const c = (a.last_name || '').localeCompare(b.last_name || '');
        return c !== 0 ? c : (a.first_name || '').localeCompare(b.first_name || '');
      }
      if (sortBy === 'grade') return (a.grade || 0) - (b.grade || 0);
      if (sortBy === 'age') {
        const aD = a.dob ? new Date(a.dob).getTime() : Infinity;
        const bD = b.dob ? new Date(b.dob).getTime() : Infinity;
        return aD - bD;
      }
      if (sortBy === 'attendance') {
        const getPct = (p) => p.attendance_pct ?? (p.totalPast > 0 ? (p.goingCount || 0) / p.totalPast : -1);
        return getPct(b) - getPct(a);
      }
      const aJ = a.jersey_number != null ? parseInt(a.jersey_number, 10) : NaN;
      const bJ = b.jersey_number != null ? parseInt(b.jersey_number, 10) : NaN;
      if (isNaN(aJ) && isNaN(bJ)) return 0;
      if (isNaN(aJ)) return 1;
      if (isNaN(bJ)) return -1;
      return aJ - bJ;
    });
  }, [players, search, sortBy]);
}

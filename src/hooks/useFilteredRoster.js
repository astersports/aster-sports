import { useMemo } from 'react';

// Filters a player list by a search query (first/last name + jersey)
// and sorts by the selected key. Memoized so the result is stable
// across re-renders unless inputs change.
//
// sortBy values: 'jersey' (default) | 'name' | 'grade'
// Null jerseys always sink to the bottom of the jersey sort.
export function useFilteredRoster(players, search, sortBy) {
  return useMemo(() => {
    const filtered = players.filter((p) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        p.first_name.toLowerCase().includes(q) ||
        p.last_name.toLowerCase().includes(q) ||
        String(p.jersey_number).includes(q)
      );
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === 'name') return a.last_name.localeCompare(b.last_name);
      if (sortBy === 'grade') return (a.grade || 0) - (b.grade || 0);
      const aJ = a.jersey_number ?? 999;
      const bJ = b.jersey_number ?? 999;
      return aJ - bJ;
    });
  }, [players, search, sortBy]);
}

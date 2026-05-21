import { useMemo } from 'react';
import { sortPlayersByOrder } from '../lib/playerSort';

// Filters a player list by a search query (first/last name + jersey)
// and sorts by the selected key. Memoized so the result is stable
// across re-renders unless inputs change.
//
// sortBy values: 'jersey' (default) | 'name' | 'grade' | 'age' | 'attendance'
// Null jerseys always sink to the bottom of the jersey sort.
// Sort impl lives in src/lib/playerSort.js (canonical, shared with TeamHeatmap).
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

    return sortPlayersByOrder(filtered, sortBy);
  }, [players, search, sortBy]);
}

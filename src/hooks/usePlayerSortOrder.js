import { useCallback, useState } from 'react';
import { useFilteredRoster } from './useFilteredRoster';

// 2026-05-21 (Teams PR C / Q10) — shared sort state so Roster + Pulse
// render players in the same order. Default sort: jersey ascending.
// Callers pass the same instance from TeamDetailPage; Pulse reads the
// returned `sortPlayers(players)` which delegates to useFilteredRoster
// (same logic the Roster section uses) keyed on '' search so the only
// effect is the sort.
export function usePlayerSortOrder(initial = 'jersey') {
  const [sortOrder, setSortOrder] = useState(initial);
  const sortPlayers = useCallback(
    // Local hook call would violate rules-of-hooks; instead expose the
    // sortOrder so consumers can call useFilteredRoster themselves with
    // a stable empty-string search. Consumers that already use
    // useFilteredRoster (RosterSection via parent) just thread sortOrder
    // through and skip the local sort.
    (players) => players,
    [],
  );
  return { sortOrder, setSortOrder, sortPlayers };
}

// Convenience hook for consumers that want the sorted result directly.
// Honors the search prop too so a single hook covers Roster's needs.
export function useSortedPlayers(players, search, sortOrder) {
  return useFilteredRoster(players || [], search || '', sortOrder || 'jersey');
}

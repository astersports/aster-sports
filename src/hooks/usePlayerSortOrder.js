import { useState } from 'react';
import { useFilteredRoster } from './useFilteredRoster';

// 2026-05-21 (Teams PR C / Q10) — shared sort state so Roster + Pulse
// render players in the same order. Default sort: jersey ascending.
// TeamDetailPage instantiates once and threads `sortOrder` down to
// RosterSection (which calls useFilteredRoster) AND to TeamHeatmap
// (which calls sortPlayersByOrder from src/lib/playerSort.js directly).
// Both surfaces consume the same canonical sort impl.
export function usePlayerSortOrder(initial = 'jersey') {
  const [sortOrder, setSortOrder] = useState(initial);
  return { sortOrder, setSortOrder };
}

// Convenience hook for consumers that want the sorted result directly.
// Honors the search prop too so a single hook covers Roster's needs.
export function useSortedPlayers(players, search, sortOrder) {
  return useFilteredRoster(players || [], search || '', sortOrder || 'jersey');
}

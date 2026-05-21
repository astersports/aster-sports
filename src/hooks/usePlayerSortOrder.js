import { useState } from 'react';

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

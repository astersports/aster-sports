// Tournament live/upcoming/past status + directory filtering for the Hub filter
// pills (R1·PR-A). Pure (AP #27). Dates are YYYY-MM-DD strings, so lexicographic
// comparison == chronological. `todayYmd` is the NY calendar day, passed in by
// the caller so the helper stays IO-free and timezone-correct.

export function tournamentStatus(t, todayYmd) {
  const start = t?.start_date;
  const end = t?.end_date || start;
  if (!start) return 'upcoming'; // unknown window → don't hide it
  if (end && end < todayYmd) return 'past';
  if (start > todayYmd) return 'upcoming';
  return 'live';
}

// Keep only the tournaments matching the selected status ('all' = no filter).
export function filterTournaments(tournaments, statusKey, todayYmd) {
  if (!Array.isArray(tournaments)) return [];
  if (!statusKey || statusKey === 'all') return tournaments;
  return tournaments.filter((t) => tournamentStatus(t, todayYmd) === statusKey);
}

// Per-status counts for the pill labels (so a parent sees how many are under each).
export function statusCounts(tournaments, todayYmd) {
  const counts = { all: 0, live: 0, upcoming: 0, past: 0 };
  for (const t of tournaments || []) {
    counts.all += 1;
    counts[tournamentStatus(t, todayYmd)] += 1;
  }
  return counts;
}

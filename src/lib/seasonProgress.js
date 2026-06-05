const WEEK = 7 * 24 * 60 * 60 * 1000;

// Shared week-of-season progress. Single source intended to close the
// duplicate impls in ActiveSeasonCard + ProgramHealthCard (home audit α4) —
// nowMs is injected so callers and tests control the clock. Dates before the
// start clamp to week 1; past the end clamp to the final week (never 0 of 0).
export function seasonProgress(season, nowMs = Date.now()) {
  if (!season?.start_date || !season?.end_date) {
    return { pct: 0, weekIdx: 0, totalWeeks: 0, label: null };
  }
  const s = new Date(season.start_date).getTime();
  const e = new Date(season.end_date).getTime();
  const totalMs = Math.max(e - s, 1);
  const totalWeeks = Math.max(1, Math.round(totalMs / WEEK));
  const elapsed = Math.min(Math.max(nowMs - s, 0), totalMs);
  const weekIdx = Math.min(totalWeeks, Math.max(1, Math.ceil((elapsed / WEEK) || 1)));
  return { pct: elapsed / totalMs, weekIdx, totalWeeks, label: `Week ${weekIdx} of ${totalWeeks}` };
}

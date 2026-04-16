// Given a start date, recurrence pattern, and optional season end,
// return the last occurrence date of that weekday at or before the
// season end. Fallback: 12 weeks (84 days) out when seasonEndDate is
// missing or already past the start date.
//
// All inputs and outputs are YYYY-MM-DD strings. Dates are
// constructed as local-midnight (no Z) to avoid timezone drift.
export function computeDefaultUntil(startDate, pattern, seasonEndDate) {
  const start = new Date(`${startDate}T00:00:00`);
  const step = pattern === 'biweekly' ? 14 : 7;
  if (seasonEndDate) {
    const end = new Date(`${seasonEndDate}T00:00:00`);
    if (end >= start) {
      let cursor = new Date(start);
      let last = new Date(start);
      while (cursor <= end) {
        last = new Date(cursor);
        cursor.setDate(cursor.getDate() + step);
      }
      return last.toISOString().slice(0, 10);
    }
  }
  const fallback = new Date(start);
  fallback.setDate(fallback.getDate() + 84);
  return fallback.toISOString().slice(0, 10);
}

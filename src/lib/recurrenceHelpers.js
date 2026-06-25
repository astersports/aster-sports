// Given a start date, recurrence pattern, and optional season end,
// return the last occurrence date of that weekday at or before the
// season end. Fallback: 12 weeks (84 days) out when seasonEndDate is
// missing or already past the start date.
//
// All inputs and outputs are YYYY-MM-DD strings. Dates are constructed as
// local-midnight (no Z); read them back with the LOCAL getters too. Using
// toISOString().slice(0,10) here was off-by-one in positive-UTC-offset
// browsers (local-midnight maps to the previous UTC day).
function toLocalIsoDate(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

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
      return toLocalIsoDate(last);
    }
  }
  const fallback = new Date(start);
  fallback.setDate(fallback.getDate() + 84);
  return toLocalIsoDate(fallback);
}

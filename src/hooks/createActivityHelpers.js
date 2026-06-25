// Date helpers for useCreateActivity, extracted to keep the hook under the
// 150-line cap (CLAUDE.md §6).

// Builds the ISO-string start_at / end_at for a specific date, holding
// the HH:MM constant. Called once per recurring instance.
export function withTime(row, date, formData) {
  // new Date('YYYY-MM-DDTHH:MM') is interpreted as LOCAL time per the
  // ECMA-262 Date Time String Format; .toISOString() then converts to
  // UTC for storage. Do not append 'Z' or an offset — that would force
  // UTC parsing and shift events by the user's timezone.
  const startDate = new Date(`${date}T${formData.startTime}`);
  const endDate = new Date(`${date}T${formData.endTime}`);
  // Late-night events (e.g. start 22:00 → end 01:03) cross midnight;
  // bump the end date forward a day so end_at > start_at.
  if (endDate <= startDate) endDate.setDate(endDate.getDate() + 1);
  return {
    ...row,
    start_at: startDate.toISOString(),
    end_at: endDate.toISOString(),
  };
}

// Returns an array of YYYY-MM-DD strings. For 'once' it's [startDate];
// for weekly/biweekly it steps by 7 or 14 days up to (and including)
// the `until` date, capped at 26 to avoid runaway loops.
export function expandDates(formData, pattern) {
  const startDate = formData.date;
  if (pattern === 'once') return [startDate];
  const step = pattern === 'weekly' ? 7 : 14;
  const until = formData.recurrence?.until
    ? new Date(`${formData.recurrence.until}T00:00:00`)
    : null;
  const out = [];
  const cursor = new Date(`${startDate}T00:00:00`);
  while ((!until || cursor <= until) && out.length < 26) {
    out.push(cursor.toISOString().slice(0, 10));
    cursor.setDate(cursor.getDate() + step);
  }
  return out;
}

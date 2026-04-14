// Date-range helpers for DayStrip. Kept in a separate module so the
// component stays lean.

export function mondayOf(d) {
  const m = new Date(d);
  const day = m.getDay();
  m.setDate(m.getDate() - ((day + 6) % 7));
  m.setHours(0, 0, 0, 0);
  return m;
}

export function sundayOf(d) {
  const s = new Date(d);
  const day = s.getDay();
  s.setDate(s.getDate() + (day === 0 ? 0 : 7 - day));
  s.setHours(23, 59, 59, 999);
  return s;
}

// Returns [monday of earliest week, sunday of latest week] covering
// the entire season — earliest event through latest event, always
// including today. With no events, falls back to today-3/+10 snapped
// to Mon/Sun so the strip always shows at least the current week.
export function getSeasonRange(activities) {
  const today = new Date();
  const safe = Array.isArray(activities) ? activities : [];
  const dates = safe
    .map((a) => a?.start_at ? new Date(a.start_at) : null)
    .filter((d) => d && !Number.isNaN(d.getTime()));
  if (dates.length === 0) {
    const back = new Date(today); back.setDate(today.getDate() - 3);
    const forward = new Date(today); forward.setDate(today.getDate() + 10);
    return [mondayOf(back), sundayOf(forward)];
  }
  const times = dates.map((d) => d.getTime());
  const minD = new Date(Math.min(...times));
  const maxD = new Date(Math.max(...times));
  const lo = minD < today ? minD : today;
  const hi = maxD > today ? maxD : today;
  return [mondayOf(lo), sundayOf(hi)];
}

export function enumerateDates(start, end) {
  const out = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    out.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return out;
}

export function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

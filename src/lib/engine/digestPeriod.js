// Digest period + subject formatting. All dates rendered in NY tz so
// "May 11–17" matches the operator's mental model regardless of where
// admin runs the dispatch.

const NY_TZ = 'America/New_York';
const monthDayFmt = new Intl.DateTimeFormat('en-US', { timeZone: NY_TZ, month: 'short', day: 'numeric' });
const dayOnlyFmt  = new Intl.DateTimeFormat('en-US', { timeZone: NY_TZ, day: 'numeric' });
const monthFmt    = new Intl.DateTimeFormat('en-US', { timeZone: NY_TZ, month: 'short' });
const yearFmt     = new Intl.DateTimeFormat('en-US', { timeZone: NY_TZ, year: 'numeric' });

// D2 — defaultPeriod:
//   Mon-Wed (1-3): period = current week (this Monday → Sunday)
//   Sun (0) + Thu-Sat (4-6): period = next week (next Monday → Sunday)
// Sun is treated as the lead-in to next week so the digest stays
// forward-looking rather than reporting a week that has already passed.
export function defaultPeriod(now = new Date()) {
  const dow = now.getDay();
  const useNext = dow === 0 || dow >= 4;
  const daysAfterMon = (dow + 6) % 7;
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - daysAfterMon + (useNext ? 7 : 0));
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return { start, end };
}

// "May 11–17" same month, "May 28–Jun 3" cross-month, "Dec 30, 2026–Jan 5, 2027" cross-year.
export function formatPeriodLabel(period) {
  if (!period?.start || !period?.end) return '';
  const startMonth = monthFmt.format(period.start);
  const endMonth = monthFmt.format(period.end);
  const startYear = yearFmt.format(period.start);
  const endYear = yearFmt.format(period.end);
  if (startYear !== endYear) {
    return `${monthDayFmt.format(period.start)}, ${startYear}–${monthDayFmt.format(period.end)}, ${endYear}`;
  }
  if (startMonth !== endMonth) {
    return `${monthDayFmt.format(period.start)}–${monthDayFmt.format(period.end)}`;
  }
  return `${monthDayFmt.format(period.start)}–${dayOnlyFmt.format(period.end)}`;
}

export function formatSubject(period) {
  return `Week ahead — ${formatPeriodLabel(period)}`;
}

// Used by useDigestEvents: ISO date strings for the SQL filter window.
export function periodIsoBounds(period) {
  if (!period?.start || !period?.end) return { startIso: null, endIso: null };
  const endExclusive = new Date(period.end);
  endExclusive.setDate(endExclusive.getDate() + 1);
  return {
    startIso: period.start.toISOString(),
    endIso: endExclusive.toISOString(),
  };
}

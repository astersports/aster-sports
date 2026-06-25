// Digest period + subject formatting. All dates rendered in NY tz so
// "May 11–17" matches the operator's mental model regardless of where
// admin runs the dispatch.

const NY_TZ = 'America/New_York';

// ET calendar parts (weekday + Y/M/D) for `date`. Avoids Date.getDay()/
// getDate() drift — on a UTC serverless host (tenant #2 / cron) those
// local accessors read the host zone, not NY, and the digest drafts the
// wrong week. Mirrors the Intl-parts pattern in cron/briefingCronHelpers.
function etParts(date) {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: NY_TZ, weekday: 'long', year: 'numeric', month: '2-digit', day: '2-digit',
  });
  const p = Object.fromEntries(fmt.formatToParts(date).map((x) => [x.type, x.value]));
  return { weekday: p.weekday, year: Number(p.year), month: Number(p.month), day: Number(p.day) };
}

const WEEKDAY_INDEX = {
  Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6,
};
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
  const { weekday, year, month, day } = etParts(now);
  const dow = WEEKDAY_INDEX[weekday];
  const useNext = dow === 0 || dow >= 4;
  const daysAfterMon = (dow + 6) % 7;
  // Anchor the ET calendar date at noon UTC so day arithmetic + the UTC-
  // slice the rest of the pipeline takes never crosses a date boundary.
  const start = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  start.setUTCDate(start.getUTCDate() - daysAfterMon + (useNext ? 7 : 0));
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 6);
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
  return `Week ahead: ${formatPeriodLabel(period)}`;
}

// Used by useDigestEvents: ISO date strings for the SQL filter window.
// start/end carry the ET calendar dates (anchored at noon UTC by
// defaultPeriod); floor each to UTC midnight of that same date and make the
// end exclusive at the day-after so the window spans whole days.
export function periodIsoBounds(period) {
  if (!period?.start || !period?.end) return { startIso: null, endIso: null };
  const floorToUtcMidnight = (d) => new Date(`${d.toISOString().slice(0, 10)}T00:00:00.000Z`);
  const startIso = floorToUtcMidnight(period.start).toISOString();
  const endExclusive = floorToUtcMidnight(period.end);
  endExclusive.setUTCDate(endExclusive.getUTCDate() + 1);
  return { startIso, endIso: endExclusive.toISOString() };
}

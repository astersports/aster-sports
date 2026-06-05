// DST-correct Eastern-time date helpers shared by the coach_roundup and
// family_guide resolvers.
//
// REPLACES a hardcoded `-4h` EDT offset (`toEt(iso) => new Date(utcMs - 4h)`)
// that was wrong for the EST half of the year (Nov–Mar): it produced times
// one hour off and could mis-group an evening-ET event into the wrong
// calendar day. These helpers use Intl.DateTimeFormat with
// timeZone:'America/New_York', which the runtime resolves to the correct
// EDT/EST offset for the given instant — the same approach rsvpNudgeHelpers
// and scheduleChangeHelpers already use.

const NY_TZ = 'America/New_York';

// "WED 5/11" — uppercase short weekday + ET month/day.
const shortWeekdayFmt = new Intl.DateTimeFormat('en-US', { timeZone: NY_TZ, weekday: 'short' });
// "5/11/2026" parts via en-US numeric so we can read month/day in ET.
const numericDateFmt = new Intl.DateTimeFormat('en-US', { timeZone: NY_TZ, year: 'numeric', month: 'numeric', day: 'numeric' });
// "7:35 PM" — ET clock time.
const timeFmt = new Intl.DateTimeFormat('en-US', { timeZone: NY_TZ, hour: 'numeric', minute: '2-digit', hour12: true });
// "2026-05-11" — ISO date in ET, for same-day grouping comparisons.
const isoDateFmt = new Intl.DateTimeFormat('en-CA', { timeZone: NY_TZ, year: 'numeric', month: '2-digit', day: '2-digit' });

function etParts(iso) {
  const parts = numericDateFmt.formatToParts(new Date(iso));
  const get = (t) => parts.find((p) => p.type === t)?.value || '';
  return { month: get('month'), day: get('day') };
}

// "WED 5/11" — short weekday + ET month/day. Returns 'TBD' for nullish iso.
export function formatDayLabel(iso) {
  if (!iso) return 'TBD';
  const { month, day } = etParts(iso);
  const wk = shortWeekdayFmt.format(new Date(iso)).toUpperCase();
  return `${wk} ${month}/${day}`;
}

// "7:35 PM" — ET clock time. Returns 'TBD' for nullish iso.
export function formatTime(iso) {
  if (!iso) return 'TBD';
  return timeFmt.format(new Date(iso));
}

// "2026-05-11" — ET calendar date, for same-day conflict grouping.
export function etDateStr(iso) {
  return isoDateFmt.format(new Date(iso));
}

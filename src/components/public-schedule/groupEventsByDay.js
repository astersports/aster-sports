// Pure helper: group an already-sorted (ascending by start_at) event list
// into NY-day buckets for the public schedule's sticky day headers (E1).
// NY-anchored day key so a viewer in any timezone sees the games bucketed
// by the game's local (NY) calendar day, matching the formatters' NY pin.
// Pure + deterministic (no Date.now / Math.random) so it is safe to call
// in render and unit-testable.

const NY_TZ = 'America/New_York';

// "2026-04-13" NY-local calendar day for an ISO timestamp.
export function nyDayKey(iso) {
  return new Date(iso).toLocaleDateString('en-CA', { timeZone: NY_TZ });
}

// "Today" / "Tomorrow" / "Sat, Apr 13" relative label for a day key,
// computed against an injected `now` Date (callers pass a stable, memoized
// value so this stays pure — no Date.now() in render).
export function dayLabel(dayKeyStr, now) {
  const today = nyDayKey(now.toISOString());
  const tomorrowDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const tomorrow = nyDayKey(tomorrowDate.toISOString());
  if (dayKeyStr === today) return 'Today';
  if (dayKeyStr === tomorrow) return 'Tomorrow';
  // dayKeyStr is YYYY-MM-DD (NY-local); anchor at noon NY to avoid the
  // midnight DST roll-back (same discipline as formatters.js).
  return new Date(`${dayKeyStr}T12:00:00`).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', timeZone: NY_TZ,
  });
}

// Pure NY-anchored countdown to an event start, computed against an
// injected `now` (render callers pass a memoized Date so this never reads
// the wall clock during render). "Now" / "in 35m" / "in 2h 15m" /
// "Tomorrow 6:30 PM" / "Sat 5:00 PM" — mirrors formatters.formatCountdown
// but with the clock injected for render-purity.
export function countdownTo(startAt, now) {
  const start = new Date(startAt);
  const diff = start.getTime() - now.getTime();
  if (diff < 0) return 'Now';
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `in ${mins}m`;
  const hrs = Math.floor(mins / 60);
  const rm = mins % 60;
  if (hrs < 24) return `in ${hrs}h ${rm}m`;
  const timeStr = start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: NY_TZ });
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  if (nyDayKey(startAt) === nyDayKey(tomorrow.toISOString())) return `Tomorrow ${timeStr}`;
  const wd = start.toLocaleDateString('en-US', { weekday: 'short', timeZone: NY_TZ });
  return `${wd} ${timeStr}`;
}

// Returns [{ key, events: [...] }] preserving input order.
export function groupEventsByDay(events) {
  const groups = [];
  const index = new Map();
  for (const e of events) {
    const key = nyDayKey(e.start_at);
    let group = index.get(key);
    if (!group) {
      group = { key, events: [] };
      index.set(key, group);
      groups.push(group);
    }
    group.events.push(e);
  }
  return groups;
}

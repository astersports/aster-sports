// Shared date / time / money formatters. Everything in the app that renders
// a time, date, or currency should go through these so the output stays
// consistent and switching locales later is a single-file edit.

const NY_TZ = 'America/New_York';

// "6:30 PM" — lowercase meridiem stripped by toLocaleTimeString by default.
export function formatTime(time) {
  const d = typeof time === 'string' && time.length <= 8 && time.includes(':')
    ? new Date(`1970-01-01T${time}`)
    : new Date(time);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

// "Monday, April 13, 2026" — full date headers, confirmation dialogs.
export function formatDateFull(date) {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

// "+5.3" / "-2.1" / "0.0" / "—" — point-differential cell. Pre-rounded
// numerics are passed in (computeSummary already toFixed(1)s); helper
// only handles the sign prefix + null/NaN guards.
export function formatDiff(d) {
  if (d == null) return '—';
  const n = Number(d);
  if (Number.isNaN(n)) return '—';
  return n > 0 ? `+${n}` : `${n}`;
}

// "Just now" / "5 minutes ago" / "2 hours ago" / "3 days ago" within
// 7 days; absolute NY-anchored date thereafter. Returns null on
// null/undefined input so consumers can suppress rendering entirely
// (matches the lastPublishedAt null-handling pattern from 3d-d). The
// helper does NOT bake in any "Updated " / "Last updated " prefix —
// consumers wrap as appropriate (BroadcastHeroHeader already prefixes
// "Last updated " in JSX).
export function formatRelativeTime(isoString) {
  if (!isoString) return null;
  const then = new Date(isoString);
  const diffSec = Math.floor((Date.now() - then.getTime()) / 1000);
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? '' : 's'} ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hour${diffHr === 1 ? '' : 's'} ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay} day${diffDay === 1 ? '' : 's'} ago`;
  return then.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: NY_TZ });
}

// "$450.00" — takes integer cents to avoid float drift on pricing math.
export function formatCurrency(cents) {
  const n = (cents ?? 0) / 100;
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

// NEXT UP date helpers. NY-anchored so a parent on Pacific time still sees
// "Sat May 3 · 2:00 PM" matching the local game time, not 11:00 AM PT.

// MAX variant: "Sat, May 3 · 2:00 PM"
export function formatEventDateMax(startAt) {
  const d = new Date(startAt);
  const date = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: NY_TZ });
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: NY_TZ });
  return `${date} · ${time}`;
}

// MED variant: "Sat May 3 · 2:00 PM" — same as MAX without the comma.
export function formatEventDateMed(startAt) {
  const d = new Date(startAt);
  const weekday = d.toLocaleDateString('en-US', { weekday: 'short', timeZone: NY_TZ });
  const monthDay = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: NY_TZ });
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: NY_TZ });
  return `${weekday} ${monthDay} · ${time}`;
}

// MIN variant — relative-first:
//   today  → "Today · 2:00 PM"
//   tomorrow → "Tomorrow · 2:00 PM"
//   within 7 days → "Sat · 2:00 PM"
//   beyond → "May 3 · 2:00 PM"
export function formatEventDateMin(startAt) {
  const d = new Date(startAt);
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: NY_TZ });
  // en-CA gives YYYY-MM-DD; we use it purely to compare NY-local calendar
  // dates without parsing back into a Date.
  const dayKey = (date) => date.toLocaleDateString('en-CA', { timeZone: NY_TZ });
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const eventDay = dayKey(d);
  if (eventDay === dayKey(today)) return `Today · ${time}`;
  if (eventDay === dayKey(tomorrow)) return `Tomorrow · ${time}`;
  const sevenOut = new Date(today);
  sevenOut.setDate(sevenOut.getDate() + 7);
  if (d < sevenOut) {
    const weekday = d.toLocaleDateString('en-US', { weekday: 'short', timeZone: NY_TZ });
    return `${weekday} · ${time}`;
  }
  const monthDay = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: NY_TZ });
  return `${monthDay} · ${time}`;
}

// "in 35m", "in 2h 15m", "Tomorrow 6:30 PM", "Wed 5:00 PM"
export function formatCountdown(startAt) {
  const diff = new Date(startAt) - new Date();
  if (diff < 0) return 'Now';
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `in ${mins}m`;
  const hrs = Math.floor(mins / 60);
  const rm = mins % 60;
  if (hrs < 24) return `in ${hrs}h ${rm}m`;
  const dt = new Date(startAt);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (dt.toDateString() === tomorrow.toDateString()) {
    return `Tomorrow ${dt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
  }
  return dt.toLocaleDateString('en-US', { weekday: 'short' }) + ' ' +
    dt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

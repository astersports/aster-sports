// Shared date / time / money formatters. Everything in the app that renders
// a time, date, or currency should go through these so the output stays
// consistent and switching locales later is a single-file edit.

const NY_TZ = 'America/New_York';

// "6:30 PM" — lowercase meridiem stripped by toLocaleTimeString by default.
// NY-anchored: a parent on Pacific or European time sees the NY-local
// game time, not their own browser-local interpretation.
export function formatTime(time) {
  const d = typeof time === 'string' && time.length <= 8 && time.includes(':')
    ? new Date(`1970-01-01T${time}`)
    : new Date(time);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: NY_TZ });
}

// "Monday, April 13, 2026" — full date headers, confirmation dialogs.
// NY-anchored: see formatTime comment.
export function formatDateFull(date) {
  const d = typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)
    ? new Date(date + 'T12:00:00')
    : new Date(date);
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: NY_TZ,
  });
}

// "+5.3" / "-2.1" / "0.0" / "—" — point-differential cell. Always 1
// decimal so columns align even when value is an exact integer (e.g.
// the diff lands on +5.0, prior version rendered "+5" and broke
// rhythm). 2026-05-20 fix per Frank-flagged "9U Boys · 21 PA" sibling.
export function formatDiff(d) {
  if (d == null) return '—';
  const n = Number(d);
  if (Number.isNaN(n)) return '—';
  const fixed = n.toFixed(1);
  return n > 0 ? `+${fixed}` : fixed;
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

// "Apr 13" / "Apr 13–15" / "Apr 30–May 2" / "Apr 13–15, 2026" — tournament
// date span. Collapses same-day / same-month / cross-month. Date-only inputs
// (YYYY-MM-DD) are anchored at NOON NY (`T12:00:00`), NOT midnight: a midnight
// anchor (`T00:00:00`) lands a date-only value on the prior calendar day once
// NY shifts to EDT (UTC-4), so "May 1" renders "Apr 30". The noon anchor is
// DST-safe for every US offset. Consolidates the three prior per-component
// formatRange copies (TournamentHeader / TournamentListItem / broadcast
// TournamentCard) — the broadcast copy used the buggy midnight anchor. Locked
// by formatTournamentRange.test.js.
export function formatTournamentRange(start, end, { withYear = false } = {}) {
  if (!start) return '';
  const opts = { month: 'short', day: 'numeric', timeZone: NY_TZ };
  const yearOpts = withYear ? { ...opts, year: 'numeric' } : opts;
  const s = new Date(start + 'T12:00:00');
  if (!end) return s.toLocaleDateString('en-US', yearOpts);
  const e = new Date(end + 'T12:00:00');
  if (start === end) return s.toLocaleDateString('en-US', yearOpts);
  const sameMonth = s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear();
  const yearSuffix = withYear ? `, ${e.getFullYear()}` : '';
  if (sameMonth) {
    return `${s.toLocaleDateString('en-US', opts)}–${e.getDate()}${yearSuffix}`;
  }
  return `${s.toLocaleDateString('en-US', opts)}–${e.toLocaleDateString('en-US', opts)}${yearSuffix}`;
}

// "in 35m", "in 2h 15m", "Tomorrow 6:30 PM", "Wed 5:00 PM"
// NY-anchored "Tomorrow" boundary + time render: a parent on Pacific or
// European time sees "Tomorrow" relative to the NY day boundary, not
// their own local midnight.
export function formatCountdown(startAt) {
  const diff = new Date(startAt) - new Date();
  if (diff < 0) return 'Now';
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `in ${mins}m`;
  const hrs = Math.floor(mins / 60);
  const rm = mins % 60;
  if (hrs < 24) return `in ${hrs}h ${rm}m`;
  const dt = new Date(startAt);
  const dayKey = (date) => date.toLocaleDateString('en-CA', { timeZone: NY_TZ });
  // Tomorrow's NY day-key must be derived from NY's "today", not the browser's
  // local day — otherwise a non-NY browser can be off by one near NY midnight.
  const todayNyKey = dayKey(new Date());
  const tomorrowNyKey = dayKey(new Date(new Date(todayNyKey + 'T12:00:00').getTime() + 86400000));
  if (dayKey(dt) === tomorrowNyKey) {
    return `Tomorrow ${dt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: NY_TZ })}`;
  }
  return dt.toLocaleDateString('en-US', { weekday: 'short', timeZone: NY_TZ }) + ' ' +
    dt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: NY_TZ });
}

// "Mon, 6:30 PM" — short weekday + time render. Used by ride pickup/return
// labels where day-of-week context matters at a glance. Returns null on
// null/undefined input so consumers can suppress rendering (same null-guard
// shape as formatRelativeTime). NY-pinned and handles time-only-string
// inputs the same way as formatTime.
export function formatDayTime(time) {
  if (!time) return null;
  const d = typeof time === 'string' && time.length <= 8 && time.includes(':')
    ? new Date(`1970-01-01T${time}`)
    : new Date(time);
  return d.toLocaleString('en-US', {
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: NY_TZ,
  });
}

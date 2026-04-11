// Shared date / time / money formatters. Everything in the app that renders
// a date, time, countdown, or currency should go through these so the output
// stays consistent and switching locales later is a single-file edit.

// "Mon · Apr 13" — compact row header for list items and day strip cells.
export function formatDate(date) {
  const d = new Date(date);
  const weekday = d.toLocaleDateString('en-US', { weekday: 'short' });
  const md = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${weekday} · ${md}`;
}

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

// "$450.00" — takes integer cents to avoid float drift on pricing math.
export function formatCurrency(cents) {
  const n = (cents ?? 0) / 100;
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

// "in 3h 20m" for the future, "2 days ago" for the past.
// Coarse granularity — good enough for card subtitles and change logs.
export function getRelativeTime(date) {
  const target = new Date(date).getTime();
  const diff = target - Date.now();
  const abs = Math.abs(diff);
  const mins = Math.floor(abs / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  const future = diff >= 0;

  if (mins < 1) return future ? 'in moments' : 'just now';
  if (mins < 60) return future ? `in ${mins}m` : `${mins}m ago`;
  if (hours < 24) {
    const remMins = mins % 60;
    const body = remMins > 0 ? `${hours}h ${remMins}m` : `${hours}h`;
    return future ? `in ${body}` : `${body} ago`;
  }
  const unit = days === 1 ? 'day' : 'days';
  return future ? `in ${days} ${unit}` : `${days} ${unit} ago`;
}

// "Starts in 2h 15m" — used by the countdown banner on Today's event card.
// Returns null once the event has started so callers can swap to a live label.
export function formatCountdown(targetDate) {
  const diff = new Date(targetDate).getTime() - Date.now();
  if (diff <= 0) return null;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Starts in <1m';
  if (mins < 60) return `Starts in ${mins}m`;
  const hours = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem > 0 ? `Starts in ${hours}h ${rem}m` : `Starts in ${hours}h`;
}

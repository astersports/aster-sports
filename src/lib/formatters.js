// Shared date / time / money formatters. Everything in the app that renders
// a time, date, or currency should go through these so the output stays
// consistent and switching locales later is a single-file edit.

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

// RSVP closes at the event START TIME, every event (HOME_RENDER_RULES_CC #1b,
// Frank 2026-06-06). Pure label derived from the start time — no new field, no
// fabrication. Relative countdown ("RSVP closes in 1d 4h") when the event is
// within RELATIVE_MAX_MS; an absolute close ("RSVP by Sat 9:00 AM") beyond
// that. Returns null once start has passed (RSVP closed) so the caller drops
// the chip. nowMs injected for React-purity + testability.
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const RELATIVE_MAX_MS = 48 * HOUR;

export function rsvpCloseLabel(startAt, nowMs = Date.now()) {
  if (!startAt) return null;
  const start = new Date(startAt).getTime();
  const diff = start - nowMs;
  if (diff <= 0) return null;
  if (diff <= RELATIVE_MAX_MS) {
    const days = Math.floor(diff / DAY);
    const hours = Math.floor((diff % DAY) / HOUR);
    const mins = Math.floor((diff % HOUR) / 60000);
    if (days > 0) return `RSVP closes in ${days}d ${hours}h`;
    if (hours > 0) return `RSVP closes in ${hours}h ${mins}m`;
    return `RSVP closes in ${mins}m`;
  }
  const d = new Date(start);
  const day = d.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'America/New_York' });
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/New_York' });
  return `RSVP by ${day} ${time}`;
}

import { describe, expect, it } from 'vitest';
import { rsvpCloseLabel } from '../rsvpDeadline';

// #1b deadline chip — RSVP closes at event start, all events. Pure label.
const NOW = new Date('2026-04-15T12:00:00-04:00').getTime();
const fromNow = (ms) => new Date(NOW + ms).toISOString();
const H = 60 * 60 * 1000;

describe('rsvpCloseLabel', () => {
  it('returns null once the event start has passed (RSVP closed)', () => {
    expect(rsvpCloseLabel(fromNow(-H), NOW)).toBeNull();
    expect(rsvpCloseLabel(null, NOW)).toBeNull();
  });

  it('relative "in Xd Yh" when within 48h', () => {
    expect(rsvpCloseLabel(fromNow(28 * H), NOW)).toBe('RSVP closes in 1d 4h');
  });

  it('relative "in Xh Ym" under a day', () => {
    expect(rsvpCloseLabel(fromNow(2 * H + 30 * 60 * 1000), NOW)).toBe('RSVP closes in 2h 30m');
  });

  it('relative minutes only when under an hour', () => {
    expect(rsvpCloseLabel(fromNow(45 * 60 * 1000), NOW)).toBe('RSVP closes in 45m');
  });

  it('absolute "RSVP by Day Time" beyond 48h', () => {
    // 3 days out — absolute form, ET-pinned.
    expect(rsvpCloseLabel(fromNow(72 * H), NOW)).toMatch(/^RSVP by \w{3} \d{1,2}:\d{2} (AM|PM)$/);
  });
});

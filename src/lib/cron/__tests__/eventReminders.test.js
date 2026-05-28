import { describe, expect, it } from 'vitest';
import { composeReminder, decideReminder, isQuietHoursET } from '../eventReminders.js';

const H = 3600000;

describe('decideReminder cadence + burst-collapse', () => {
  const start = Date.parse('2026-05-30T18:30:00Z'); // Sat 2:30pm ET game

  it('fires nothing before the first (72h) threshold', () => {
    const now = start - 100 * H;
    expect(decideReminder(start, now, [])).toBeNull();
  });

  it('fires 72h once its threshold passes', () => {
    const now = start - 71 * H;
    expect(decideReminder(start, now, [])).toEqual({ sendBucket: '72h', supersededBuckets: [] });
  });

  it('fires 24h after 72h already logged', () => {
    const now = start - 23 * H;
    expect(decideReminder(start, now, ['72h'])).toEqual({ sendBucket: '24h', supersededBuckets: [] });
  });

  it('collapses a burst: event found already inside 24h window sends 24h, supersedes 72h', () => {
    const now = start - 20 * H; // both 72h and 24h thresholds passed, 4h not
    expect(decideReminder(start, now, [])).toEqual({ sendBucket: '24h', supersededBuckets: ['72h'] });
  });

  it('sends the most-urgent (4h) and supersedes both larger when found very late', () => {
    const now = start - 2 * H;
    expect(decideReminder(start, now, [])).toEqual({ sendBucket: '4h', supersededBuckets: ['24h', '72h'] });
  });

  it('returns null once all passed offsets are logged', () => {
    const now = start - 2 * H;
    expect(decideReminder(start, now, ['72h', '24h', '4h'])).toBeNull();
  });

  it('never fires for an event that already started', () => {
    expect(decideReminder(start, start + H, [])).toBeNull();
    expect(decideReminder(start, start, [])).toBeNull();
  });
});

describe('isQuietHoursET', () => {
  it('is quiet at 4am ET (08:00Z EDT) and 11pm ET, awake at noon ET', () => {
    expect(isQuietHoursET(new Date('2026-05-30T08:00:00Z'))).toBe(true);  // 4am ET
    expect(isQuietHoursET(new Date('2026-05-31T03:00:00Z'))).toBe(true);  // 11pm ET prev day
    expect(isQuietHoursET(new Date('2026-05-30T16:00:00Z'))).toBe(false); // noon ET
    expect(isQuietHoursET(new Date('2026-05-30T11:00:00Z'))).toBe(false); // 7am ET (awake boundary)
    expect(isQuietHoursET(new Date('2026-05-30T10:59:00Z'))).toBe(true);  // 6:59am ET
  });
});

describe('composeReminder', () => {
  const event = {
    opponent: 'OAU (MA) - Marcos Sr', start_at: '2026-05-30T18:30:00Z',
    location: 'Wheaton College', sub_location: 'Court 1',
    arrival_minutes_before: 20, jersey: 'Black side out',
  };

  it('renders pinned ET time, matchup, place, arrival + jersey', () => {
    const r = composeReminder(event, '24h');
    expect(r.title).toBe('Reminder: vs OAU (MA) - Marcos Sr tomorrow');
    expect(r.pushBody).toContain('Sat, May 30 · 2:30 PM · Wheaton College · Court 1');
    expect(r.pushBody).toContain('Arrive 20 min early. Jersey: Black side out.');
    expect(r.subject).toBe('vs OAU (MA) - Marcos Sr tomorrow — 2:30 PM');
    expect(r.html).toContain('Wheaton College');
  });

  it('is pure: same input -> deeply-equal output', () => {
    expect(composeReminder(event, '4h')).toEqual(composeReminder(event, '4h'));
  });

  it('falls back to title when opponent missing and omits empty tail', () => {
    const r = composeReminder({ title: 'Semifinal', start_at: '2026-05-31T18:30:00Z' }, '4h');
    expect(r.title).toBe('Reminder: Semifinal in 4 hours');
    expect(r.pushBody).not.toContain('—'); // no tail dash when arrival/jersey absent
  });
});

import { describe, expect, it } from 'vitest';
import { defaultPeriod, formatPeriodLabel, formatSubject, periodIsoBounds } from '../digestPeriod';

// Helper: format YYYY-MM-DD for a Date — the period bounds carry the ET
// calendar date anchored at noon UTC, so the UTC slice is the ET date.
function ymd(d) {
  return d.toISOString().slice(0, 10);
}
// UTC weekday of the noon-UTC anchor (matches the ET calendar weekday).
function utcDay(d) {
  return d.getUTCDay();
}

describe('defaultPeriod (D2)', () => {
  // Anchor "now" at 12:00 UTC on each weekday so DST + tz offsets don't
  // bump the local-day calculation around.
  it('Mon-Wed → current week (this Monday)', () => {
    const tuesday = new Date('2026-05-12T12:00:00Z'); // Tue
    const { start, end } = defaultPeriod(tuesday);
    expect(utcDay(start)).toBe(1); // Monday
    expect(utcDay(end)).toBe(0);   // Sunday
    expect(ymd(start)).toBe('2026-05-11');
    expect(ymd(end)).toBe('2026-05-17');
  });

  // ET-anchor regression: late Sunday-night ET = Monday UTC. The window must
  // be computed from the ET weekday (Sunday → next week), not the UTC one.
  it('Sun 11pm ET (=Mon 03:00 UTC) → next week, not the UTC-Monday week', () => {
    const sunNightEt = new Date('2026-05-11T03:00:00Z'); // Sun 23:00 ET, May 10
    const { start, end } = defaultPeriod(sunNightEt);
    expect(ymd(start)).toBe('2026-05-11');
    expect(ymd(end)).toBe('2026-05-17');
  });
  it('Thu-Sat → next week', () => {
    const saturday = new Date('2026-05-09T12:00:00Z'); // Sat
    const { start, end } = defaultPeriod(saturday);
    expect(ymd(start)).toBe('2026-05-11');
    expect(ymd(end)).toBe('2026-05-17');
  });
  it('Sun → next week (forward-looking treatment)', () => {
    const sunday = new Date('2026-05-10T12:00:00Z'); // Sun
    const { start, end } = defaultPeriod(sunday);
    expect(ymd(start)).toBe('2026-05-11');
    expect(ymd(end)).toBe('2026-05-17');
  });
  it('Mon → current week (this Monday is today)', () => {
    const monday = new Date('2026-05-11T12:00:00Z'); // Mon
    const { start } = defaultPeriod(monday);
    expect(ymd(start)).toBe('2026-05-11');
  });
});

describe('formatPeriodLabel + formatSubject', () => {
  it('same-month range collapses second month name', () => {
    const period = { start: new Date('2026-05-11T12:00:00Z'), end: new Date('2026-05-17T12:00:00Z') };
    expect(formatPeriodLabel(period)).toBe('May 11–17');
    expect(formatSubject(period)).toBe('Week ahead: May 11–17');
  });
  it('cross-month range keeps both month names', () => {
    const period = { start: new Date('2026-05-28T12:00:00Z'), end: new Date('2026-06-03T12:00:00Z') };
    expect(formatPeriodLabel(period)).toBe('May 28–Jun 3');
    expect(formatSubject(period)).toBe('Week ahead: May 28–Jun 3');
  });
  it('cross-year range includes year on both sides', () => {
    const period = { start: new Date('2026-12-30T12:00:00Z'), end: new Date('2027-01-05T12:00:00Z') };
    expect(formatPeriodLabel(period)).toBe('Dec 30, 2026–Jan 5, 2027');
    expect(formatSubject(period)).toBe('Week ahead: Dec 30, 2026–Jan 5, 2027');
  });
  it('empty period yields empty label', () => {
    expect(formatPeriodLabel({})).toBe('');
    expect(formatPeriodLabel(null)).toBe('');
  });
});

describe('periodIsoBounds', () => {
  it('end is exclusive (advanced one day)', () => {
    const period = { start: new Date('2026-05-11T00:00:00Z'), end: new Date('2026-05-17T00:00:00Z') };
    const { startIso, endIso } = periodIsoBounds(period);
    expect(startIso).toBe('2026-05-11T00:00:00.000Z');
    expect(endIso).toBe('2026-05-18T00:00:00.000Z');
  });
  it('returns null bounds when period missing', () => {
    expect(periodIsoBounds(null)).toEqual({ startIso: null, endIso: null });
  });
});

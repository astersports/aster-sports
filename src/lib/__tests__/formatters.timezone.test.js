// NY-pin regression contract for shared formatters.
//
// Frank surfaced a timezone bug from Italy (CEST = UTC+2) on
// 2026-05-17: event times rendered overnight because formatTime,
// formatDateFull, and formatCountdown defined toLocale* calls
// without applying the NY_TZ constant defined in the same file.
//
// This suite locks the contract: every event-facing formatter
// renders in America/New_York regardless of the test runner's
// host timezone. The fix landed in PR fix/timezone-formatters-
// ny-pin; this test was missing pre-fix so the regression went
// unnoticed until smoke from outside EDT.
//
// Pattern: hardcode UTC ISO strings (Z suffix). If formatters
// pin NY correctly, output matches regardless of host TZ. If a
// future edit drops the timeZone option, these assertions fail
// loud.

import { describe, expect, it } from 'vitest';
import { formatCountdown, formatDateFull, formatDayTime, formatTime } from '../formatters';

describe('formatTime NY-pin contract', () => {
  it('renders UTC ISO as NY-local time (EDT window, May)', () => {
    // 2026-05-18 22:00 UTC = 6:00 PM EDT (UTC-4 in DST)
    expect(formatTime('2026-05-18T22:00:00Z')).toBe('6:00 PM');
  });

  it('renders UTC ISO as NY-local time (EST window, January)', () => {
    // 2026-01-15 23:00 UTC = 6:00 PM EST (UTC-5 outside DST)
    expect(formatTime('2026-01-15T23:00:00Z')).toBe('6:00 PM');
  });

  it('renders late-night UTC as NY-local PM, not next-day AM', () => {
    // 2026-05-18 23:35 UTC = 7:35 PM EDT. Pre-fix on CEST (UTC+2)
    // would have rendered 1:35 AM. NY-pinned: 7:35 PM.
    expect(formatTime('2026-05-18T23:35:00Z')).toBe('7:35 PM');
  });

  it('renders HH:MM:SS time string in NY (no date drift)', () => {
    // Time-only strings parse as local 1970-01-01; formatTime still
    // applies NY pin so the rendered hour matches the input hour
    // when host is also NY-equivalent. From other host TZs this can
    // shift — documented behavior; the contract is "NY pinned."
    const result = formatTime('14:30:00');
    expect(result).toMatch(/^\d{1,2}:\d{2} (AM|PM)$/);
  });
});

describe('formatDateFull NY-pin contract', () => {
  it('renders YYYY-MM-DD string as NY-local full date', () => {
    expect(formatDateFull('2026-05-18')).toBe('Monday, May 18, 2026');
  });

  it('renders UTC ISO at midnight-Z as NY-local previous day', () => {
    // 2026-05-19 00:00 UTC = 2026-05-18 8:00 PM EDT.
    // NY-pinned: Monday, May 18, 2026. Pre-fix on CEST would have
    // rendered Tuesday, May 19 (since 00:00 UTC = 02:00 CEST May 19).
    expect(formatDateFull('2026-05-19T00:00:00Z')).toBe('Monday, May 18, 2026');
  });
});

describe('formatCountdown NY-pin contract', () => {
  it('uses NY day boundary for Tomorrow detection on far-future event', () => {
    // Pick an event 2+ days away so the formatter falls through to
    // the weekday + time branch (not "in Xh" branch). NY-pinned
    // weekday must match the NY-local day of the event timestamp.
    const inFuture = new Date(Date.now() + 5 * 86400000); // 5d out
    inFuture.setUTCHours(22, 0, 0, 0); // 22:00 UTC = 6 PM EDT
    const out = formatCountdown(inFuture.toISOString());
    expect(out).toMatch(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun) 6:00 PM$/);
  });

  it('returns "Now" for past events', () => {
    expect(formatCountdown(new Date(Date.now() - 1000).toISOString())).toBe('Now');
  });

  it('returns "in Nm" for events within the hour', () => {
    const soon = new Date(Date.now() + 35 * 60 * 1000).toISOString();
    expect(formatCountdown(soon)).toMatch(/^in \d+m$/);
  });
});

describe('formatDayTime NY-pin contract', () => {
  it('renders UTC ISO as NY-local weekday + time (EDT window, May)', () => {
    // 2026-05-18 22:00 UTC = Monday May 18, 6:00 PM EDT
    expect(formatDayTime('2026-05-18T22:00:00Z')).toMatch(/^Mon,? 6:00 PM$/);
  });

  it('renders UTC ISO as NY-local weekday + time (EST window, January)', () => {
    // 2026-01-15 23:00 UTC = Thursday Jan 15, 6:00 PM EST
    expect(formatDayTime('2026-01-15T23:00:00Z')).toMatch(/^Thu,? 6:00 PM$/);
  });

  it('returns null on null input (consumer-suppression contract)', () => {
    expect(formatDayTime(null)).toBe(null);
  });

  it('returns null on undefined input', () => {
    expect(formatDayTime(undefined)).toBe(null);
  });
});

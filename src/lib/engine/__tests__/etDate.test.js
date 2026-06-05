// Regression test for the DST-correct ET helpers that replaced the hardcoded
// -4h offset in coachRoundupHelpers + familyGuideHelpers. The old offset was
// correct in EDT (summer) but wrong by an hour in EST (winter, Nov–Mar), and
// could mis-group an evening-ET event into the next UTC day.

import { describe, expect, it } from 'vitest';
import { etDateStr, formatDayLabel, formatTime } from '../etDate';
import { detectConflicts } from '../resolvers/familyGuideHelpers';

describe('etDate (DST-correct ET helpers)', () => {
  // 2026-01-14 is EST (UTC-5). 8:30 PM EST = 01:30 UTC on 2026-01-15.
  const winterEveningUtc = '2026-01-15T01:30:00Z';

  it('renders the correct ET HOUR in winter (EST = UTC-5)', () => {
    // -4h offset would have produced 9:30 PM; correct EST answer is 8:30 PM.
    expect(formatTime(winterEveningUtc)).toBe('8:30 PM');
  });

  it('renders the correct ET DAY (and weekday) in winter', () => {
    // 8:30 PM EST falls on Jan 14 (Wednesday), not the UTC Jan 15.
    expect(formatDayLabel(winterEveningUtc)).toBe('WED 1/14');
    expect(etDateStr(winterEveningUtc)).toBe('2026-01-14');
  });

  it('renders the correct ET hour in summer (EDT = UTC-4)', () => {
    // 2026-07-15 7:00 PM EDT = 23:00 UTC.
    expect(formatTime('2026-07-15T23:00:00Z')).toBe('7:00 PM');
    expect(formatDayLabel('2026-07-15T23:00:00Z')).toBe('WED 7/15');
  });

  it('returns TBD for nullish iso', () => {
    expect(formatTime(null)).toBe('TBD');
    expect(formatDayLabel(undefined)).toBe('TBD');
  });
});

describe('familyGuide same-day conflict grouping (ET, not UTC)', () => {
  it('groups two evening-EST events on the same ET day as a conflict', () => {
    // Both events are the evening of Jan 14 EST but cross into Jan 15 UTC.
    // Overlapping windows -> conflict only if grouped by the SAME ET day.
    const kidsWithEvents = [
      { player_id: 'p1', first_name: 'Ava', team_name: '10U Blue', team_color: '#4a8fd4',
        events: [{ id: 'e1', start_at: '2026-01-15T01:00:00Z', end_at: '2026-01-15T02:00:00Z' }] },
      { player_id: 'p2', first_name: 'Ben', team_name: '9U Boys', team_color: '#222',
        events: [{ id: 'e2', start_at: '2026-01-15T01:30:00Z', end_at: '2026-01-15T02:30:00Z' }] },
    ];
    const conflicts = detectConflicts(kidsWithEvents);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].reason).toBe('overlap');
    expect(conflicts[0].date_label).toBe('WED 1/14');
  });
});

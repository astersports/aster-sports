import { describe, expect, it } from 'vitest';
import { computeDefaultUntil } from '../recurrenceHelpers';

// Output must be the LOCAL-midnight date string, not a toISOString().slice
// (which was off-by-one in positive-UTC-offset browsers). These dates are
// far from any offset boundary so the assertion holds regardless of the
// test runner's zone.
describe('computeDefaultUntil', () => {
  it('weekly: last weekly occurrence at or before season end', () => {
    // Mondays from 03-23: ... 06-08, 06-15 (>06-14 end) → 06-08.
    expect(computeDefaultUntil('2026-03-23', 'weekly', '2026-06-14')).toBe('2026-06-08');
  });

  it('biweekly: every 14 days', () => {
    // 03-23, 04-06, 04-20, 05-04, 05-18, 06-01 (06-15 > end) → 06-01.
    expect(computeDefaultUntil('2026-03-23', 'biweekly', '2026-06-14')).toBe('2026-06-01');
  });

  it('falls back to 84 days out when season end missing', () => {
    // 2026-03-23 + 84 days = 2026-06-15.
    expect(computeDefaultUntil('2026-03-23', 'weekly', null)).toBe('2026-06-15');
  });

  it('falls back to 84 days when season end precedes start', () => {
    expect(computeDefaultUntil('2026-03-23', 'weekly', '2026-03-01')).toBe('2026-06-15');
  });
});

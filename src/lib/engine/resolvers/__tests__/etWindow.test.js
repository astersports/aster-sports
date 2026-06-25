import { describe, expect, it } from 'vitest';
import { etDayEndUtc } from '../etWindow';

// The upper bound must be 23:59:59.999 ET — which is the NEXT UTC day's
// early hours — so a Saturday-night ET game (e.g. 9pm ET) stays in window.
describe('etDayEndUtc — ET-anchored end-of-day upper bound', () => {
  it('EDT date (May, UTC-4): end-of-day ET = 03:59:59.999 UTC next day', () => {
    expect(etDayEndUtc('2026-05-23')).toBe('2026-05-24T03:59:59.999Z');
  });

  it('EST date (Jan, UTC-5): end-of-day ET = 04:59:59.999 UTC next day', () => {
    expect(etDayEndUtc('2026-01-10')).toBe('2026-01-11T04:59:59.999Z');
  });

  it('includes a 9pm-ET Saturday game the naive UTC bound would drop', () => {
    const upper = etDayEndUtc('2026-05-23');               // Sat
    const game = '2026-05-24T01:00:00.000Z';               // 9pm ET Sat
    const naive = '2026-05-23T23:59:59Z';
    expect(game <= upper).toBe(true);   // ET bound keeps it
    expect(game <= naive).toBe(false);  // naive UTC bound drops it
  });
});

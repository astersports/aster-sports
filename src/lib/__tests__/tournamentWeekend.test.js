import { describe, expect, it } from 'vitest';
import { hasWeekendDays, weekendDaysInRange } from '../tournamentWeekend';

describe('tournamentWeekend.hasWeekendDays', () => {
  it('Sat-only single day → false (need both)', () => {
    expect(hasWeekendDays('2026-05-09', '2026-05-09')).toBe(false); // Sat
  });
  it('Sun-only single day → false', () => {
    expect(hasWeekendDays('2026-05-10', '2026-05-10')).toBe(false); // Sun
  });
  it('Sat-Sun (canonical weekend tournament) → true', () => {
    expect(hasWeekendDays('2026-05-16', '2026-05-17')).toBe(true);
  });
  it('Fri-Sun (3 day) → true', () => {
    expect(hasWeekendDays('2026-05-15', '2026-05-17')).toBe(true);
  });
  it('Mon-Fri weekday-only range → false', () => {
    expect(hasWeekendDays('2026-05-11', '2026-05-15')).toBe(false);
  });
  it('Mon-Mon (week+1) → true (covers Sat + Sun mid-range)', () => {
    expect(hasWeekendDays('2026-05-11', '2026-05-18')).toBe(true);
  });
  it('reversed range → false (defensive, no surprise true)', () => {
    expect(hasWeekendDays('2026-05-17', '2026-05-16')).toBe(false);
  });
  it('null inputs → false', () => {
    expect(hasWeekendDays(null, null)).toBe(false);
    expect(hasWeekendDays('2026-05-16', null)).toBe(false);
  });
});

describe('tournamentWeekend.weekendDaysInRange', () => {
  it('Sat-Sun returns both with dow + label', () => {
    const out = weekendDaysInRange('2026-05-16', '2026-05-17');
    expect(out).toHaveLength(2);
    expect(out[0]).toMatchObject({ iso: '2026-05-16', dow: 6 });
    expect(out[1]).toMatchObject({ iso: '2026-05-17', dow: 0 });
    expect(out[0].label).toMatch(/Sat/);
    expect(out[1].label).toMatch(/Sun/);
  });
  it('Mon-Fri returns empty', () => {
    expect(weekendDaysInRange('2026-05-11', '2026-05-15')).toEqual([]);
  });
  it('multi-week range returns all weekend days in order', () => {
    const out = weekendDaysInRange('2026-05-11', '2026-05-24');
    // Two weekends covered: 5/16-17 and 5/23-24
    expect(out.map((d) => d.iso)).toEqual(['2026-05-16', '2026-05-17', '2026-05-23', '2026-05-24']);
  });
  it('null inputs return empty', () => {
    expect(weekendDaysInRange(null, '2026-05-17')).toEqual([]);
  });
});

import { describe, expect, it } from 'vitest';
import { isWithinForecastWindow } from '../forecastWindow';

const NOW = Date.UTC(2026, 5, 20, 12, 0, 0);
const at = (days) => new Date(NOW + days * 24 * 60 * 60 * 1000).toISOString();

describe('isWithinForecastWindow — parish "next event within N days" rule', () => {
  it('true for an event a few days out', () => {
    expect(isWithinForecastWindow(at(3), NOW)).toBe(true);
  });
  it('false beyond the default 10-day window', () => {
    expect(isWithinForecastWindow(at(11), NOW)).toBe(false);
  });
  it('false for a past event', () => {
    expect(isWithinForecastWindow(at(-1), NOW)).toBe(false);
  });
  it('inclusive exactly at the window boundary', () => {
    expect(isWithinForecastWindow(at(10), NOW)).toBe(true);
  });
  it('false for an invalid date', () => {
    expect(isWithinForecastWindow('not-a-date', NOW)).toBe(false);
  });
  it('honors a custom days argument', () => {
    expect(isWithinForecastWindow(at(5), NOW, 3)).toBe(false);
    expect(isWithinForecastWindow(at(2), NOW, 3)).toBe(true);
  });
});

// DL-13 gate (SCHEDULE_L99_BUILD_SPEC SD-9, PR-C'): hourly matching is
// pure epoch arithmetic on `timeMs` (Open-Meteo &timeformat=unixtime).
// The v1 shape (TZ-naive NY-local strings parsed browser-local) is
// rejected by the shape guard instead of silently mis-matching.

import { describe, expect, it } from 'vitest';
import { getWeatherForTime } from '../useWeather';

const T0 = Date.UTC(2026, 5, 13, 17, 0, 0); // 2026-06-13 17:00Z = 1:00 PM NY

const hoursAround = [
  { timeMs: T0 - 2 * 3600_000, temp: 70, icon: '☀️', label: 'Clear' },
  { timeMs: T0, temp: 75, icon: '⛅', label: 'Partly cloudy' },
  { timeMs: T0 + 3600_000, temp: 77, icon: '☁️', label: 'Overcast' },
];

describe('getWeatherForTime — epoch matching (DL-13)', () => {
  it('returns the closest hour by absolute epoch distance', () => {
    const hit = getWeatherForTime({ hours: hoursAround }, new Date(T0 + 20 * 60_000).toISOString());
    expect(hit.temp).toBe(75);
  });

  it('returns null beyond the 2h window', () => {
    expect(getWeatherForTime({ hours: hoursAround }, new Date(T0 + 6 * 3600_000).toISOString())).toBeNull();
  });

  it('ignores v1-shaped entries (string time) instead of mis-parsing them', () => {
    const mixed = [{ time: '2026-06-13T13:00', temp: 1 }, ...hoursAround];
    const hit = getWeatherForTime({ hours: mixed }, new Date(T0).toISOString());
    expect(hit.temp).toBe(75);
  });

  it('null on missing data', () => {
    expect(getWeatherForTime(null, new Date().toISOString())).toBeNull();
    expect(getWeatherForTime({ hours: hoursAround }, null)).toBeNull();
  });
});

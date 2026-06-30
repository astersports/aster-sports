// weatherAdvice — game-day advice line for the Hub up-next hero (R1·PR-A).
// Locks the WMO-code precedence (wet/cold conditions outrank a mild temp) and
// the no-fabrication null when the hour is unknown.

import { describe, expect, it } from 'vitest';
import { weatherAdvice } from '../weatherAdvice';

describe('weatherAdvice', () => {
  it('returns null when the hour or temp is unknown (no fabrication)', () => {
    expect(weatherAdvice(null)).toBeNull();
    expect(weatherAdvice({ code: 0 })).toBeNull();
  });

  it('flags rain regardless of a comfortable temperature', () => {
    expect(weatherAdvice({ temp: 70, code: 61 })).toMatch(/Rain/);
    expect(weatherAdvice({ temp: 72, code: 80 })).toMatch(/Rain/);
  });

  it('flags thunderstorms and snow', () => {
    expect(weatherAdvice({ temp: 75, code: 95 })).toMatch(/Storms/);
    expect(weatherAdvice({ temp: 30, code: 73 })).toMatch(/Snow/);
  });

  it('advises on temperature when the sky is clear/cloudy', () => {
    expect(weatherAdvice({ temp: 90, code: 1 })).toMatch(/Hot/);
    expect(weatherAdvice({ temp: 35, code: 0 })).toMatch(/Cold/);
    expect(weatherAdvice({ temp: 47, code: 2 })).toMatch(/Cool/);
    expect(weatherAdvice({ temp: 68, code: 1 })).toMatch(/comfortable/);
  });
});

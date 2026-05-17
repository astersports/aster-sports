// Tier 3 v1 PR 2 — Q1 derivation lookup tests.
// Covers the documented Legacy mappings + DEFAULT_THRESHOLD fallback.

import { describe, expect, it } from 'vitest';
import { DEFAULT_THRESHOLD, lookupThreshold, TEAM_THRESHOLDS, thresholdForTeam } from '../thresholds';

describe('lookupThreshold (Q1 derivation)', () => {
  it('returns 5 for Legacy 11U AAU', () => {
    expect(lookupThreshold('11U', 'AAU')).toBe(5);
  });
  it('returns 5 for Legacy 10U AAU + 10U League Play', () => {
    expect(lookupThreshold('10U', 'AAU')).toBe(5);
    expect(lookupThreshold('10U', 'League Play')).toBe(5);
  });
  it('returns 5 for Legacy 9U League Play', () => {
    expect(lookupThreshold('9U', 'League Play')).toBe(5);
  });
  it('returns 4 for 8U AAU + 8U League Play (4-on-4 format)', () => {
    expect(lookupThreshold('8U', 'AAU')).toBe(4);
    expect(lookupThreshold('8U', 'League Play')).toBe(4);
  });
  it('returns DEFAULT_THRESHOLD for unknown age_group/circuit', () => {
    expect(lookupThreshold('14U', 'AAU')).toBe(DEFAULT_THRESHOLD);
    expect(lookupThreshold('11U', 'Travel')).toBe(DEFAULT_THRESHOLD);
    expect(lookupThreshold(null, null)).toBe(DEFAULT_THRESHOLD);
  });
});

describe('thresholdForTeam (convenience wrapper)', () => {
  it('reads age_group + circuit from a team object', () => {
    expect(thresholdForTeam({ age_group: '8U', circuit: 'AAU' })).toBe(4);
    expect(thresholdForTeam({ age_group: '11U', circuit: 'AAU' })).toBe(5);
  });
  it('falls back when team is null/undefined', () => {
    expect(thresholdForTeam(null)).toBe(DEFAULT_THRESHOLD);
    expect(thresholdForTeam(undefined)).toBe(DEFAULT_THRESHOLD);
  });
  it('falls back when team has no age_group/circuit', () => {
    expect(thresholdForTeam({})).toBe(DEFAULT_THRESHOLD);
    expect(thresholdForTeam({ age_group: '8U' })).toBe(DEFAULT_THRESHOLD);
  });
});

describe('TEAM_THRESHOLDS structure', () => {
  it('exports a flat lookup object', () => {
    expect(typeof TEAM_THRESHOLDS).toBe('object');
    expect(TEAM_THRESHOLDS['8U']['AAU']).toBe(4);
  });
});

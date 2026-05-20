// fmt1 — single-decimal formatter for team stats.
// Frank flagged 2026-05-20: "9U Boys · 21 PA" while sibling rows
// showed "20.4 PA" etc — template literal stripped trailing zeros
// on exact integers. fmt1 always emits one decimal.

import { describe, expect, it } from 'vitest';
import { fmt1 } from '../teamRecords';
import { formatDiff } from '../formatters';

describe('fmt1', () => {
  it('preserves single decimal on non-integer values', () => {
    expect(fmt1(20.4)).toBe('20.4');
    expect(fmt1(17.5)).toBe('17.5');
  });

  it('forces single decimal on exact integers (the 21 PA bug)', () => {
    expect(fmt1(21)).toBe('21.0');
    expect(fmt1(0)).toBe('0.0');
    expect(fmt1(100)).toBe('100.0');
  });

  it('handles null / undefined / NaN as 0.0', () => {
    expect(fmt1(null)).toBe('0.0');
    expect(fmt1(undefined)).toBe('0.0');
    expect(fmt1(NaN)).toBe('0.0');
  });
});

describe('formatDiff (1-decimal alignment fix)', () => {
  it('exact integer diff shows .0 (was the 21 PA sibling bug)', () => {
    expect(formatDiff(5)).toBe('+5.0');
    expect(formatDiff(-3)).toBe('-3.0');
    expect(formatDiff(0)).toBe('0.0');
  });

  it('decimal diff preserves one place', () => {
    expect(formatDiff(2.9)).toBe('+2.9');
    expect(formatDiff(-1.5)).toBe('-1.5');
  });

  it('null / NaN → em-dash', () => {
    expect(formatDiff(null)).toBe('—');
    expect(formatDiff(NaN)).toBe('—');
  });
});

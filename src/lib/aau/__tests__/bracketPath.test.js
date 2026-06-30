// groupBracketByDay — NY-anchored day buckets for the Hub Playoff-path view.

import { describe, expect, it } from 'vitest';
import { groupBracketByDay } from '../bracketPath';

describe('groupBracketByDay', () => {
  it('buckets games by NY calendar day, ascending, preserving within-day order', () => {
    const games = [
      { gameCode: 'B1', startAt: '2026-08-13T23:30:00Z' }, // Aug 13 7:30p ET
      { gameCode: 'B5', startAt: '2026-08-18T22:30:00Z' }, // Aug 18 6:30p ET
      { gameCode: 'B2', startAt: '2026-08-13T23:30:00Z' }, // Aug 13 7:30p ET
    ];
    const out = groupBracketByDay(games);
    expect(out).toHaveLength(2);
    expect(out[0].label).toMatch(/Aug 13/);
    expect(out[0].games.map((g) => g.gameCode)).toEqual(['B1', 'B2']);
    expect(out[1].label).toMatch(/Aug 18/);
  });

  it('puts games with no start time in a trailing "Date TBD" bucket', () => {
    const out = groupBracketByDay([
      { gameCode: 'BX', startAt: null },
      { gameCode: 'B1', startAt: '2026-08-13T23:30:00Z' },
    ]);
    expect(out[0].label).toMatch(/Aug 13/);
    expect(out[out.length - 1].label).toBe('Date TBD');
  });

  it('returns [] for empty / non-array input', () => {
    expect(groupBracketByDay([])).toEqual([]);
    expect(groupBracketByDay(null)).toEqual([]);
  });
});

import { describe, expect, it } from 'vitest';
import { predictBracket } from '../predictBracket';

const ZG = { pointDiffCap: 20, tiebreakers: ['head_to_head', 'point_diff'] };
const teams = ['A', 'B', 'C', 'D'].map((id) => ({ id, name: id }));

describe('predictBracket — OQ5 guard + decided cases', () => {
  it('withholds odds when advanceCount is unconfirmed (null)', () => {
    const out = predictBracket({ teams, games: [], remaining: [], rules: ZG, advanceCount: null, focusId: 'A' });
    expect(out.available).toBe(false);
    expect(out.reason).toBe('advance_count_unconfirmed');
  });

  it('reports decided=true (100%) when no games remain and focus is in', () => {
    // A 2-0, B 2-1, C/D worse. top 2 advance -> A in.
    const games = [
      { aId: 'A', bId: 'C', aScore: 50, bScore: 30 },
      { aId: 'A', bId: 'D', aScore: 50, bScore: 30 },
      { aId: 'B', bId: 'C', aScore: 41, bScore: 40 },
      { aId: 'B', bId: 'D', aScore: 41, bScore: 40 },
      { aId: 'C', bId: 'D', aScore: 50, bScore: 40 },
    ];
    const out = predictBracket({ teams, games, remaining: [], rules: ZG, advanceCount: 2, focusId: 'A' });
    expect(out).toMatchObject({ available: true, decided: true, oddsPct: 100, status: 'in' });
  });
});

describe('predictBracket — enumerated odds + scenarios', () => {
  it('clinched: focus advances in every remaining outcome -> 100%, status clinched', () => {
    // A already 2-0 and far ahead; one game left between C and D doesn't threaten A's top-2.
    const games = [
      { aId: 'A', bId: 'C', aScore: 60, bScore: 30 },
      { aId: 'A', bId: 'D', aScore: 60, bScore: 30 },
      { aId: 'B', bId: 'C', aScore: 55, bScore: 30 },
      { aId: 'B', bId: 'D', aScore: 55, bScore: 30 },
    ];
    const remaining = [{ aId: 'C', bId: 'D' }];   // 2 outcomes, neither unseats A
    const out = predictBracket({ teams, games, remaining, rules: ZG, advanceCount: 2, focusId: 'A' });
    expect(out).toMatchObject({ available: true, status: 'clinched', oddsPct: 100, outcomes: 2, advancing: 2 });
  });

  it('win-and-in: focus clinches by winning its last game (not by losing)', () => {
    // A 1-1, B 1-1, C 2-0, D 0-2. A and B both chase the 2nd seed; A plays B last.
    const games = [
      { aId: 'C', bId: 'A', aScore: 50, bScore: 40 },   // C beats A
      { aId: 'A', bId: 'D', aScore: 60, bScore: 30 },   // A beats D big (+20 capped)
      { aId: 'C', bId: 'B', aScore: 50, bScore: 48 },   // C beats B
      { aId: 'B', bId: 'D', aScore: 55, bScore: 50 },   // B beats D
    ];
    const remaining = [{ aId: 'A', bId: 'B' }];          // winner takes 2nd behind C
    const out = predictBracket({ teams, games, remaining, rules: ZG, advanceCount: 2, focusId: 'A' });
    expect(out.available).toBe(true);
    expect(out.status).toBe('live');
    expect(out.oddsPct).toBe(50);                        // 1 of 2 outcomes
    expect(out.scenarios.some((s) => s.kind === 'in')).toBe(true);   // "win and you clinch"
    expect(out.scenarios.some((s) => s.kind === 'out')).toBe(true);  // "lose and you're out"
  });

  it('declines to enumerate when too many games remain (fail-safe, not silent sampling)', () => {
    const remaining = Array.from({ length: 17 }, (_, i) => ({ aId: `X${i}`, bId: `Y${i}` }));
    const out = predictBracket({ teams, games: [], remaining, rules: ZG, advanceCount: 2, focusId: 'A' });
    expect(out.available).toBe(false);
    expect(out.reason).toBe('too_many_outcomes');
  });
});

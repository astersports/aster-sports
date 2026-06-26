import { describe, expect, it } from 'vitest';
import { computeStandings, rulesFromCircuit } from '../computeStandings';
import { normalizeTeamName } from '../tiebreakers';

// Zero Gravity rules as seeded in circuit_rules: cap +20, [head_to_head, point_diff].
const ZG = { pointDiffCap: 20, tiebreakers: ['head_to_head', 'point_diff'] };

const ranks = (rows) => rows.map((r) => r.id);

describe('computeStandings — basic record + win%', () => {
  it('counts W/L and orders by win% desc', () => {
    const teams = [{ id: 'A', name: 'A' }, { id: 'B', name: 'B' }, { id: 'C', name: 'C' }];
    const games = [
      { aId: 'A', bId: 'B', aScore: 50, bScore: 40 }, // A beats B
      { aId: 'A', bId: 'C', aScore: 60, bScore: 30 }, // A beats C
      { aId: 'B', bId: 'C', aScore: 45, bScore: 44 }, // B beats C
    ];
    const out = computeStandings({ teams, games, rules: ZG });
    expect(ranks(out)).toEqual(['A', 'B', 'C']);
    expect(out[0]).toMatchObject({ wins: 2, losses: 0, rank: 1 });
    expect(out[2]).toMatchObject({ wins: 0, losses: 2, rank: 3 });
  });

  it('includes teams with zero games (they rank last on 0 win%)', () => {
    const teams = [{ id: 'A', name: 'A' }, { id: 'Z', name: 'Z' }];
    const games = [{ aId: 'A', bId: 'X', aScore: 30, bScore: 20 }];
    const out = computeStandings({ teams, games, rules: ZG });
    expect(out.find((r) => r.id === 'Z')).toMatchObject({ gp: 0, wins: 0, winPct: 0 });
  });
});

describe('computeStandings — Zero Gravity +20 differential cap', () => {
  it('caps a blowout margin at +20 (a 40-pt win counts as +20)', () => {
    const teams = [{ id: 'A', name: 'A' }, { id: 'B', name: 'B' }];
    const games = [{ aId: 'A', bId: 'B', aScore: 70, bScore: 30 }]; // +40 raw
    const out = computeStandings({ teams, games, rules: ZG });
    const a = out.find((r) => r.id === 'A');
    const b = out.find((r) => r.id === 'B');
    expect(a.diff).toBe(20);   // capped, not 40
    expect(b.diff).toBe(-20);
  });

  it('does NOT cap when the circuit has no cap (League Play, null cap)', () => {
    const teams = [{ id: 'A', name: 'A' }, { id: 'B', name: 'B' }];
    const games = [{ aId: 'A', bId: 'B', aScore: 70, bScore: 30 }];
    const out = computeStandings({ teams, games, rules: { pointDiffCap: null, tiebreakers: ['point_diff'] } });
    expect(out.find((r) => r.id === 'A').diff).toBe(40);
  });
});

describe('computeStandings — 2-way tie resolved by head-to-head', () => {
  it('the head-to-head winner ranks above an equal-record rival', () => {
    // A and B both 2-1; C and D fill the bracket. A lost to B head-to-head.
    const teams = ['A', 'B', 'C', 'D'].map((id) => ({ id, name: id }));
    const games = [
      { aId: 'B', bId: 'A', aScore: 50, bScore: 48 }, // B beats A head-to-head
      { aId: 'A', bId: 'C', aScore: 60, bScore: 40 },
      { aId: 'A', bId: 'D', aScore: 60, bScore: 40 },
      { aId: 'B', bId: 'C', aScore: 41, bScore: 40 },
      { aId: 'B', bId: 'D', aScore: 41, bScore: 40 },
      { aId: 'C', bId: 'D', aScore: 50, bScore: 30 },
    ];
    // A has a bigger overall diff, but B won head-to-head, so B ranks above A.
    const out = computeStandings({ teams, games, rules: ZG, advanceCount: 2 });
    expect(ranks(out).slice(0, 2)).toEqual(['B', 'A']);
    expect(out[0]).toMatchObject({ id: 'B', advances: true });
    expect(out[1]).toMatchObject({ id: 'A', advances: true });
  });
});

describe('computeStandings — 3-way tie resolved by capped point differential', () => {
  it('falls through circular head-to-head to point_diff', () => {
    // A,B,C each 1-1 against each other (rock-paper-scissors), all 2-1 overall.
    // H2H is circular -> point_diff (capped) decides. A has the best capped diff.
    const teams = ['A', 'B', 'C', 'D'].map((id) => ({ id, name: id }));
    const games = [
      { aId: 'A', bId: 'B', aScore: 60, bScore: 40 }, // A>B by 20
      { aId: 'B', bId: 'C', aScore: 55, bScore: 40 }, // B>C by 15
      { aId: 'C', bId: 'A', aScore: 50, bScore: 45 }, // C>A by 5
      { aId: 'A', bId: 'D', aScore: 70, bScore: 40 }, // each beats D
      { aId: 'B', bId: 'D', aScore: 70, bScore: 50 },
      { aId: 'C', bId: 'D', aScore: 70, bScore: 60 },
    ];
    const out = computeStandings({ teams, games, rules: ZG });
    // D is 0-3, last. A/B/C ordered by capped point_diff: A best, then B, then C.
    expect(ranks(out)).toEqual(['A', 'B', 'C', 'D']);
    expect(out[3].id).toBe('D');
  });
});

describe('rulesFromCircuit + normalizeTeamName helpers', () => {
  it('maps a circuit_rules row to engine rules', () => {
    expect(rulesFromCircuit({ point_differential_cap: 20 })).toEqual({
      pointDiffCap: 20, tiebreakers: ['head_to_head', 'point_diff'],
    });
    expect(rulesFromCircuit({ point_differential_cap: null }).pointDiffCap).toBeNull();
  });

  it('normalizes scraper name variance for identity keying', () => {
    expect(normalizeTeamName('  New York   Jayhawks ')).toBe('new york jayhawks');
  });

  it('advanceCount=null withholds the advances flag (advancement TBD, OQ5)', () => {
    const out = computeStandings({ teams: [{ id: 'A', name: 'A' }], games: [], rules: ZG, advanceCount: null });
    expect(out[0].advances).toBeNull();
  });
});

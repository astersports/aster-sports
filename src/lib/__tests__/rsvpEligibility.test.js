// PR-V1 gate (visual-pass V7.1 + AP #43): THE one denominator contract.
// Frank caught the divergence live: schedule chip "0 going / 10 rostered"
// vs detail hero "14 no reply" on the SAME game (4 unactivated academy
// kids in the raw roster). Both surfaces now derive from these helpers —
// this test locks the contract and the cross-surface agreement.

import { describe, expect, it } from 'vitest';
import { denominatorFor, eligibleRoster, isGameType } from '../rsvpEligibility';

// The production fixture: 10 rostered + 4 academy, 1 activated.
const ROSTER = [
  ...Array.from({ length: 10 }, (_, i) => ({ id: `r-${i}`, member_type: 'roster' })),
  ...Array.from({ length: 4 }, (_, i) => ({ id: `a-${i}`, member_type: 'futures_academy' })),
];
const ACTIVATED = new Set(['a-0']);

describe('rsvpEligibility — the SD-6 contract', () => {
  it('game: rostered + ACTIVATED academy only (11, not 14)', () => {
    expect(eligibleRoster(ROSTER, 'game', ACTIVATED)).toHaveLength(11);
    expect(eligibleRoster(ROSTER, 'tournament', ACTIVATED)).toHaveLength(11);
    expect(eligibleRoster(ROSTER, 'game', new Set())).toHaveLength(10);
  });

  it('practice: rostered + ALL academy (practices ARE the academy program)', () => {
    expect(eligibleRoster(ROSTER, 'practice', new Set())).toHaveLength(14);
    expect(eligibleRoster(ROSTER, 'practice', ACTIVATED)).toHaveLength(14);
  });

  it('cross-surface invariant (AP #43): detail roster-filter and schedule count-form agree', () => {
    for (const eventType of ['game', 'tournament', 'practice']) {
      const detailSide = eligibleRoster(ROSTER, eventType, ACTIVATED).length;
      const scheduleSide = denominatorFor(eventType, 10, 4, ACTIVATED.size);
      expect(scheduleSide, `${eventType}: schedule(${scheduleSide}) must equal detail(${detailSide})`).toBe(detailSide);
    }
  });

  it('guards: null roster, missing activatedSet', () => {
    expect(eligibleRoster(null, 'game', undefined)).toEqual([]);
    expect(eligibleRoster(ROSTER, 'game', undefined)).toHaveLength(10);
    expect(isGameType('game') && isGameType('tournament')).toBe(true);
    expect(isGameType('practice')).toBe(false);
  });
});

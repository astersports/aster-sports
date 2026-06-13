// PR-V1 gate (visual-pass V7.1 + AP #43): THE one denominator contract.
// Frank caught the divergence live: schedule chip "0 going / 10 rostered"
// vs detail hero "14 no reply" on the SAME game (4 unactivated academy
// kids in the raw roster). Both surfaces now derive from these helpers —
// this test locks the contract and the cross-surface agreement.

import { describe, expect, it } from 'vitest';
import { denominatorFor, eligibleRoster, isGameType, rsvpBreakdown } from '../rsvpEligibility';

// BETA consolidation (2026-06-13): rsvpBreakdown replaced 4 copy-pasted
// going/maybe/out/no-reply derivations (EventDetailHero + EventRosterLockCard
// byte-identical, RsvpSummary + EventDetailPage inline). Lock the one contract.
describe('rsvpBreakdown — one going/maybe/out/no-reply source (AP#63)', () => {
  const roster = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }, { id: 'e' }];
  it('counts each response and derives no-reply from the eligible roster size', () => {
    const rsvps = [
      { player_id: 'a', response: 'going' }, { player_id: 'b', response: 'going' },
      { player_id: 'c', response: 'maybe' }, { player_id: 'd', response: 'not_going' },
    ];
    expect(rsvpBreakdown(rsvps, roster)).toEqual({ going: 2, maybe: 1, out: 1, noReply: 1 });
  });
  it('handles null/empty inputs without throwing', () => {
    expect(rsvpBreakdown(null, null)).toEqual({ going: 0, maybe: 0, out: 0, noReply: 0 });
    expect(rsvpBreakdown([], roster)).toEqual({ going: 0, maybe: 0, out: 0, noReply: 5 });
  });
  it('never goes negative when responses exceed the roster', () => {
    const rsvps = [{ response: 'going' }, { response: 'going' }];
    expect(rsvpBreakdown(rsvps, [{ id: 'a' }]).noReply).toBe(0);
  });
});

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

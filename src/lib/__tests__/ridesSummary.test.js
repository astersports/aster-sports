// Unit tests for the pure aggregator extracted from
// useRidesTodaySummary (PR #335). Locks the math against future
// regressions per anti-pattern #43.

import { describe, expect, it } from 'vitest';
import { aggregateRidesSummary } from '../ridesSummary';

const T1 = { id: 't1', name: '10U Black', team_color: '#000' };
const T2 = { id: 't2', name: '8U Boys', team_color: '#fa0' };

describe('aggregateRidesSummary', () => {
  it('returns empty totals when no events', () => {
    const out = aggregateRidesSummary([], [], []);
    expect(out.eventCount).toBe(0);
    expect(out.totalSeatsOffered).toBe(0);
    expect(out.totalSeatsClaimed).toBe(0);
    expect(out.coveragePct).toBeNull();
    expect(out.byTeam).toEqual([]);
    expect(out.arrival.coveragePct).toBeNull();
    expect(out.return.coveragePct).toBeNull();
  });

  it('splits arrival vs return coverage by ride_type + return_needed', () => {
    const events = [
      { id: 'e1', teams: T1 },
      { id: 'e2', teams: T1 },
    ];
    const offers = [
      // e1: 4-seat round-trip (counts for both directions)
      { event_id: 'e1', seats_offered: 4, ride_type: 'round_trip' },
      // e2: 3-seat arrival-only + 2-seat return-only
      { event_id: 'e2', seats_offered: 3, ride_type: 'arrival_only' },
      { event_id: 'e2', seats_offered: 2, ride_type: 'return_only' },
    ];
    const claims = [
      // e1: 2 seats arrival + return
      { event_id: 'e1', seats_requested: 2, return_needed: true, status: 'confirmed' },
      // e2: 1 seat arrival only
      { event_id: 'e2', seats_requested: 1, return_needed: false, status: 'pending' },
    ];
    const out = aggregateRidesSummary(events, offers, claims);

    // Arrival: 4 (e1 round-trip) + 3 (e2 arrival-only) = 7 offered;
    //          2 (e1) + 1 (e2) = 3 claimed
    expect(out.arrival.offered).toBe(7);
    expect(out.arrival.claimed).toBe(3);
    expect(out.arrival.coveragePct).toBe(43); // 3/7 = 42.86 → 43

    // Return: 4 (e1 round-trip) + 2 (e2 return-only) = 6 offered;
    //         2 (e1 return_needed=true) + 0 (e2 return_needed=false) = 2
    expect(out.return.offered).toBe(6);
    expect(out.return.claimed).toBe(2);
    expect(out.return.coveragePct).toBe(33); // 2/6 = 33.3 → 33
  });

  it('treats missing ride_type as round_trip (default)', () => {
    const events = [{ id: 'e1', teams: T1 }];
    const offers = [
      { event_id: 'e1', seats_offered: 5 }, // no ride_type
    ];
    const claims = [
      { event_id: 'e1', seats_requested: 2, return_needed: true, status: 'confirmed' },
    ];
    const out = aggregateRidesSummary(events, offers, claims);
    expect(out.arrival.offered).toBe(5);
    expect(out.return.offered).toBe(5);
  });

  it('treats missing return_needed as true (default — claim needs return)', () => {
    const events = [{ id: 'e1', teams: T1 }];
    const offers = [{ event_id: 'e1', seats_offered: 4, ride_type: 'round_trip' }];
    const claims = [
      { event_id: 'e1', seats_requested: 2, status: 'confirmed' }, // no return_needed
    ];
    const out = aggregateRidesSummary(events, offers, claims);
    expect(out.arrival.claimed).toBe(2);
    expect(out.return.claimed).toBe(2);
  });

  it('counts events but zero offers + claims when no ride data', () => {
    const events = [
      { id: 'e1', teams: T1 },
      { id: 'e2', teams: T2 },
    ];
    const out = aggregateRidesSummary(events, [], []);
    expect(out.eventCount).toBe(2);
    expect(out.totalSeatsOffered).toBe(0);
    expect(out.totalSeatsClaimed).toBe(0);
    expect(out.coveragePct).toBeNull();
    expect(out.byTeam).toHaveLength(2);
    expect(out.byTeam[0].coveragePct).toBeNull();
  });

  it('computes aggregate + per-team coverage', () => {
    const events = [
      { id: 'e1', teams: T1 }, // 10U Black
      { id: 'e2', teams: T1 }, // 10U Black
      { id: 'e3', teams: T2 }, // 8U Boys
    ];
    const offers = [
      { event_id: 'e1', seats_offered: 4 },
      { event_id: 'e1', seats_offered: 3 }, // second driver same event
      { event_id: 'e3', seats_offered: 5 },
      // e2 has no offers
    ];
    const claims = [
      { event_id: 'e1', seats_requested: 2, status: 'confirmed' },
      { event_id: 'e1', seats_requested: 1, status: 'pending' },
      { event_id: 'e1', seats_requested: 1, status: 'declined' }, // excluded
      { event_id: 'e3', seats_requested: 4, status: 'waitlisted' },
      { event_id: 'e3', seats_requested: 1, status: 'cancelled' }, // excluded
    ];
    const out = aggregateRidesSummary(events, offers, claims);

    expect(out.eventCount).toBe(3);
    expect(out.totalSeatsOffered).toBe(12);  // 7 + 0 + 5
    expect(out.totalSeatsClaimed).toBe(7);   // 3 + 0 + 4
    expect(out.coveragePct).toBe(58);        // 7/12 = 58.33 → 58

    // byTeam sorted by teamName: "10U Black" < "8U Boys" lex
    expect(out.byTeam).toHaveLength(2);
    expect(out.byTeam[0].teamName).toBe('10U Black');
    expect(out.byTeam[0].eventCount).toBe(2);
    expect(out.byTeam[0].offered).toBe(7);
    expect(out.byTeam[0].claimed).toBe(3);
    expect(out.byTeam[0].coveragePct).toBe(43);  // 3/7 = 42.86 → 43

    expect(out.byTeam[1].teamName).toBe('8U Boys');
    expect(out.byTeam[1].eventCount).toBe(1);
    expect(out.byTeam[1].offered).toBe(5);
    expect(out.byTeam[1].claimed).toBe(4);
    expect(out.byTeam[1].coveragePct).toBe(80);
  });

  it('caps coverage at 100% when claims exceed offers (over-subscription)', () => {
    const events = [{ id: 'e1', teams: T1 }];
    const offers = [{ event_id: 'e1', seats_offered: 2 }];
    const claims = [
      { event_id: 'e1', seats_requested: 3, status: 'confirmed' },
      { event_id: 'e1', seats_requested: 2, status: 'waitlisted' },
    ];
    const out = aggregateRidesSummary(events, offers, claims);
    expect(out.coveragePct).toBe(100);
    expect(out.byTeam[0].coveragePct).toBe(100);
  });

  it('excludes declined + cancelled claims', () => {
    const events = [{ id: 'e1', teams: T1 }];
    const offers = [{ event_id: 'e1', seats_offered: 4 }];
    const claims = [
      { event_id: 'e1', seats_requested: 1, status: 'declined' },
      { event_id: 'e1', seats_requested: 1, status: 'cancelled' },
      { event_id: 'e1', seats_requested: 2, status: 'confirmed' },
    ];
    const out = aggregateRidesSummary(events, offers, claims);
    expect(out.totalSeatsClaimed).toBe(2);
    expect(out.coveragePct).toBe(50);
  });

  it('skips events missing teams metadata gracefully', () => {
    const events = [
      { id: 'e1', teams: T1 },
      { id: 'e2', teams: null },
      { id: 'e3' },
    ];
    const out = aggregateRidesSummary(events, [], []);
    expect(out.eventCount).toBe(3);
    expect(out.byTeam).toHaveLength(1); // only e1 contributes to byTeam
  });

  it('handles null / undefined arrays safely', () => {
    const out1 = aggregateRidesSummary(null, null, null);
    expect(out1.eventCount).toBe(0);
    const out2 = aggregateRidesSummary(undefined, undefined, undefined);
    expect(out2.eventCount).toBe(0);
  });
});

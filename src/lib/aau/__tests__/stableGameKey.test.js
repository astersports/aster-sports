// §2.D re-seed PROOF (a) + (c) + uniqueness, on fixtures drawn from REAL live
// collision data (the two same-day pool rematches surfaced 2026-06-27). Proof (b)
// — uniqueness across all 55 live collision groups — runs as the read-only SQL in
// docs/aau/AAU_RESEED_PROOF_2026-06-27.txt; these lock the key's invariants.

import { describe, expect, it } from 'vitest';
import { assignSequences, keyAll, stableGameKey, structuralRole } from '../stableGameKey.js';

// The real same-day pool rematch: "Downtown Wolves 6 - Sigma" vs "Empire State
// Storm 6", division Ballers3, 2026-06-07, games P2 (7pm) and P3 (8pm). data-gameids
// stand in for the durable TM ids (gA created before gB).
const DIV = 'div-ballers3';
const POOL = 'pool-A';
const role = structuralRole({ kind: 'P', poolKey: POOL });
const base = (id, gid, startAt) => ({
  id, sourceGameId: gid, startAt, divisionId: DIV, role,
  homeKey: 'downtown wolves 6 - sigma', awayKey: 'empire state storm 6', eventDate: '2026-06-07',
});

describe('proof (a) — a MOVED game keeps its key', () => {
  it('changing start_at + court does not change the Layer-2 key', () => {
    const before = keyAll([base('g1', 'h2026...AAA', '2026-06-07T19:00:00Z')]).get('g1');
    // same game, rescheduled to a new time + court (mutable attributes)
    const after = keyAll([{ ...base('g1', 'h2026...AAA', '2026-06-08T15:00:00Z'), court: 'Court 9' }]).get('g1');
    expect(after).toBe(before);
  });
});

describe('proof (c) — reordering same-day rematches does NOT swap keys', () => {
  // gA created before gB (data-gameid order), but gB is scheduled EARLIER in the day.
  const gA = base('gA', 'h20260607aaa', '2026-06-07T20:00:00Z'); // later time, earlier id
  const gB = base('gB', 'h20260607bbb', '2026-06-07T19:00:00Z'); // earlier time, later id

  it('sequence is by durable id, not by time', () => {
    const seq = assignSequences([gA, gB]);
    expect(seq.get('gA')).toBe(0); // earlier data-gameid -> seq 0 regardless of time
    expect(seq.get('gB')).toBe(1);
  });

  it('swapping the two games’ start times leaves both keys unchanged', () => {
    const before = keyAll([gA, gB]);
    const swapped = keyAll([
      { ...gA, startAt: '2026-06-07T19:00:00Z' },
      { ...gB, startAt: '2026-06-07T20:00:00Z' },
    ]);
    expect(swapped.get('gA')).toBe(before.get('gA'));
    expect(swapped.get('gB')).toBe(before.get('gB'));
  });

  it('the two rematch games still get DISTINCT keys (seq disambiguates)', () => {
    const keys = keyAll([gA, gB]);
    expect(keys.get('gA')).not.toBe(keys.get('gB'));
  });
});

describe('refinement 1 — global seq closes the CROSS-DAY pool-rematch gap', () => {
  // Same pair, same pool role, but the two games fall on DIFFERENT days (a pool
  // spanning a weekend). Per-day seq would give each seq 0 → identical keys. Global
  // seq (by data-gameid order, no date) gives them distinct keys.
  const role = structuralRole({ kind: 'P', poolKey: 'pool-A' });
  const day1 = { id: 'd1', sourceGameId: 'h20260606aaa', divisionId: DIV, role, homeKey: 'a', awayKey: 'b', eventDate: '2026-06-06' };
  const day2 = { id: 'd2', sourceGameId: 'h20260607bbb', divisionId: DIV, role, homeKey: 'a', awayKey: 'b', eventDate: '2026-06-07' };
  it('cross-day repeats of the same pairing get distinct keys', () => {
    const keys = keyAll([day1, day2]);
    expect(keys.get('d1')).not.toBe(keys.get('d2'));
  });
});

describe('uniqueness — role separates cross-kind same-pair games', () => {
  it('a pool game and a bracket game between the same pair get different keys', () => {
    const pool = stableGameKey({ divisionId: DIV, homeKey: 'a', awayKey: 'b', role: structuralRole({ kind: 'P', poolKey: POOL }) });
    const bracket = stableGameKey({ divisionId: DIV, homeKey: 'a', awayKey: 'b', role: structuralRole({ kind: 'B', round: 'Final', slotIndex: 0 }) });
    expect(pool).not.toBe(bracket);
  });
  it('the pair key is order-independent', () => {
    const k1 = stableGameKey({ divisionId: DIV, homeKey: 'a', awayKey: 'b', role: 'g' });
    const k2 = stableGameKey({ divisionId: DIV, homeKey: 'b', awayKey: 'a', role: 'g' });
    expect(k1).toBe(k2);
  });
});

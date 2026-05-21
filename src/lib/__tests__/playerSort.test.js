// Locking test for src/lib/playerSort.js — the canonical player sort
// impl consumed by useFilteredRoster (RosterSection) and TeamHeatmap
// (Pulse grid). Per anti-pattern #43 (cross-surface invariant test):
// asserts both consumer call shapes produce the same canonical order
// for the same input, so future drift in either consumer surfaces as
// a test failure rather than a silent UX divergence.

import { describe, expect, it } from 'vitest';
import { sortPlayersByOrder } from '../playerSort';

const P1 = { id: '1', first_name: 'Aaron', last_name: 'Adams', jersey_number: '15', dob: '2015-03-01', grade: 5, attendance_pct: 0.9 };
const P2 = { id: '2', first_name: 'Brett', last_name: 'Brown', jersey_number: '3',  dob: '2016-01-15', grade: 4, attendance_pct: 0.6 };
const P3 = { id: '3', first_name: 'Carlos', last_name: 'Cruz', jersey_number: '22', dob: '2014-11-20', grade: 5, attendance_pct: 0.75 };
const P4 = { id: '4', first_name: 'Dan',    last_name: 'Day',  jersey_number: null, dob: '2015-07-04', grade: 3, attendance_pct: 0.5 };

const PLAYERS = [P1, P2, P3, P4];

describe('sortPlayersByOrder — RosterSection call shape (player objects directly)', () => {
  it('sorts by jersey ascending, nulls sink to bottom (default)', () => {
    const out = sortPlayersByOrder(PLAYERS, 'jersey');
    expect(out.map((p) => p.id)).toEqual(['2', '1', '3', '4']);
  });

  it('sorts by name (last → first localeCompare)', () => {
    const out = sortPlayersByOrder(PLAYERS, 'name');
    expect(out.map((p) => p.id)).toEqual(['1', '2', '3', '4']);
  });

  it('sorts by grade ascending', () => {
    const out = sortPlayersByOrder(PLAYERS, 'grade');
    expect(out.map((p) => p.id)).toEqual(['4', '2', '1', '3']);
  });

  it('sorts by age (oldest first by dob)', () => {
    const out = sortPlayersByOrder(PLAYERS, 'age');
    expect(out.map((p) => p.id)).toEqual(['3', '1', '4', '2']);
  });

  it('sorts by attendance descending', () => {
    const out = sortPlayersByOrder(PLAYERS, 'attendance');
    expect(out.map((p) => p.id)).toEqual(['1', '3', '2', '4']);
  });

  it('does not mutate input array', () => {
    const original = [...PLAYERS];
    sortPlayersByOrder(PLAYERS, 'name');
    expect(PLAYERS).toEqual(original);
  });

  it('unknown sortOrder falls through to jersey default', () => {
    const out = sortPlayersByOrder(PLAYERS, 'unknown_key');
    expect(out.map((p) => p.id)).toEqual(['2', '1', '3', '4']);
  });
});

describe('sortPlayersByOrder — TeamHeatmap call shape (grid rows with accessors)', () => {
  const ROWS = [
    { player: P1, pct: 90 },
    { player: P2, pct: 60 },
    { player: P3, pct: 75 },
    { player: P4, pct: 50 },
  ];
  const accessors = {
    getPlayer: (row) => row.player,
    getAttendancePct: (row) => row.pct ?? -1,
  };

  it('sorts grid rows by jersey using getPlayer accessor', () => {
    const out = sortPlayersByOrder(ROWS, 'jersey', accessors);
    expect(out.map((r) => r.player.id)).toEqual(['2', '1', '3', '4']);
  });

  it('sorts grid rows by attendance using precomputed row.pct', () => {
    const out = sortPlayersByOrder(ROWS, 'attendance', accessors);
    expect(out.map((r) => r.player.id)).toEqual(['1', '3', '2', '4']);
  });

  it('sorts grid rows by name matching RosterSection order (cross-surface invariant)', () => {
    const rosterOrder = sortPlayersByOrder(PLAYERS, 'name').map((p) => p.id);
    const pulseOrder = sortPlayersByOrder(ROWS, 'name', accessors).map((r) => r.player.id);
    expect(pulseOrder).toEqual(rosterOrder);
  });

  it('sorts grid rows by age matching RosterSection order (cross-surface invariant)', () => {
    const rosterOrder = sortPlayersByOrder(PLAYERS, 'age').map((p) => p.id);
    const pulseOrder = sortPlayersByOrder(ROWS, 'age', accessors).map((r) => r.player.id);
    expect(pulseOrder).toEqual(rosterOrder);
  });
});

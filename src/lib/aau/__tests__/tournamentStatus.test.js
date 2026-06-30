import { describe, expect, it } from 'vitest';
import { filterTournaments, statusCounts, tournamentStatus } from '../tournamentStatus';

const TODAY = '2026-06-30';

describe('tournamentStatus', () => {
  it('classifies live / upcoming / past by the date window', () => {
    expect(tournamentStatus({ start_date: '2026-06-23', end_date: '2026-08-18' }, TODAY)).toBe('live');
    expect(tournamentStatus({ start_date: '2026-07-10', end_date: '2026-07-12' }, TODAY)).toBe('upcoming');
    expect(tournamentStatus({ start_date: '2026-05-01', end_date: '2026-05-03' }, TODAY)).toBe('past');
  });

  it('treats a same-day single-date tournament as live, and a missing window as upcoming', () => {
    expect(tournamentStatus({ start_date: '2026-06-30' }, TODAY)).toBe('live');
    expect(tournamentStatus({}, TODAY)).toBe('upcoming');
  });
});

describe('filterTournaments + statusCounts', () => {
  const list = [
    { id: 'a', start_date: '2026-06-23', end_date: '2026-08-18' }, // live
    { id: 'b', start_date: '2026-07-10', end_date: '2026-07-12' }, // upcoming
    { id: 'c', start_date: '2026-05-01', end_date: '2026-05-03' }, // past
  ];

  it("'all' returns everything; a status key filters", () => {
    expect(filterTournaments(list, 'all', TODAY)).toHaveLength(3);
    expect(filterTournaments(list, 'live', TODAY).map((t) => t.id)).toEqual(['a']);
    expect(filterTournaments(list, 'past', TODAY).map((t) => t.id)).toEqual(['c']);
  });

  it('counts per status', () => {
    expect(statusCounts(list, TODAY)).toEqual({ all: 3, live: 1, upcoming: 1, past: 1 });
  });
});

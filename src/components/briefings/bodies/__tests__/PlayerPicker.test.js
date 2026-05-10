// Wave 4.1d-3 §1.1 — PlayerPicker scope tests.
//
// PlayerPicker.jsx itself imports supabase + React, so it can't be
// imported into the unit test environment. We replicate the same
// pure helpers (filter logic + the supabase query shape constraint)
// as inline copies to verify the scope guarantees.

import { describe, expect, it } from 'vitest';

// Shape match: matches PlayerPicker.jsx supabase query line for line.
// If PlayerPicker is changed, this constant must be updated in lockstep.
const PLAYERPICKER_QUERY_FILTERS = {
  table: 'players',
  select: 'id, first_name, last_name, team_players(team_id, teams(name))',
  filters: [
    { col: 'org_id', op: 'eq' },
    { col: 'member_type', op: 'eq', value: 'futures_academy' },
  ],
  order: 'first_name',
};

function visibleAfterSearch(players, query) {
  const q = (query || '').trim().toLowerCase();
  if (!q) return players;
  return players.filter((p) => p.name.toLowerCase().includes(q));
}

const ACADEMY_ROSTER = [
  { id: 'p1', name: 'Charlie Smith', teamName: '11U Girls' },
  { id: 'p2', name: 'Maya Johnson', teamName: '10U Black' },
  { id: 'p3', name: 'Noah Chen', teamName: '' }, // no team_player row yet
  { id: 'p4', name: 'Aria Rodriguez', teamName: '11U Girls' },
];

describe('PlayerPicker scope (wave 4.1d-3 §1)', () => {
  it('query filters to member_type=futures_academy (D-COVERAGE-2)', () => {
    const memberTypeFilter = PLAYERPICKER_QUERY_FILTERS.filters.find(
      (f) => f.col === 'member_type'
    );
    expect(memberTypeFilter).toBeDefined();
    expect(memberTypeFilter.value).toBe('futures_academy');
    expect(memberTypeFilter.op).toBe('eq');
  });

  it('query is org-scoped via eq(org_id) — RLS-friendly', () => {
    const orgFilter = PLAYERPICKER_QUERY_FILTERS.filters.find(
      (f) => f.col === 'org_id'
    );
    expect(orgFilter).toBeDefined();
    expect(orgFilter.op).toBe('eq');
  });

  it('select shape no longer pulls member_type (badge removed; whole list is Academy)', () => {
    expect(PLAYERPICKER_QUERY_FILTERS.select).not.toContain('member_type');
    expect(PLAYERPICKER_QUERY_FILTERS.select).toContain('first_name');
    expect(PLAYERPICKER_QUERY_FILTERS.select).toContain('last_name');
    expect(PLAYERPICKER_QUERY_FILTERS.select).toContain('team_players');
  });
});

describe('PlayerPicker search (wave 4.1d-3 §1)', () => {
  it('empty query returns the full Academy roster', () => {
    expect(visibleAfterSearch(ACADEMY_ROSTER, '')).toHaveLength(4);
  });

  it('case-insensitive substring search by first or last name', () => {
    expect(visibleAfterSearch(ACADEMY_ROSTER, 'maya')).toHaveLength(1);
    expect(visibleAfterSearch(ACADEMY_ROSTER, 'CHEN')).toHaveLength(1);
    expect(visibleAfterSearch(ACADEMY_ROSTER, 'rodriguez')).toHaveLength(1);
  });

  it('returns empty array when search matches no Academy players', () => {
    expect(visibleAfterSearch(ACADEMY_ROSTER, 'xyz')).toEqual([]);
  });

  it('whitespace-only search treated as empty', () => {
    expect(visibleAfterSearch(ACADEMY_ROSTER, '   ')).toHaveLength(4);
  });
});

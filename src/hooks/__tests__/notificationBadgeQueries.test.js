// Wave 4.8 hygiene PR #125 — structural assertions for the Class A
// roster_members → team_players swap. The function takes supabase as
// an injected dependency, so no vi.mock plumbing is needed; we build a
// minimal chainable mock that records which tables are called + which
// filters fire on each chain, then assert post-call.

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { fetchStaffBadgeCount } from '../notificationBadgeQueries';

function chainable(table, awaitedResult) {
  const filters = [];
  const self = {
    _table: table,
    _filters: filters,
    select: () => self,
    eq: (col, val) => { filters.push(['eq', col, val]); return self; },
    gte: () => self,
    lte: () => self,
    in: () => self,
    is: (col, val) => { filters.push(['is', col, val]); return self; },
    then: (resolve) => resolve(awaitedResult),
  };
  return self;
}

let chains = [];

function makeSupabaseMock({ events = [], rosterCount = 5, rsvpCount = 2 } = {}) {
  return {
    from: (table) => {
      const result = table === 'events' ? { data: events, error: null }
        : table === 'team_players' ? { count: rosterCount, error: null }
        : table === 'event_rsvps' ? { count: rsvpCount, error: null }
        : { data: [], error: null };
      const c = chainable(table, result);
      chains.push(c);
      return c;
    },
  };
}

const baseArgs = {
  activeRole: 'admin',
  teams: ['t1'],
  nowMs: Date.UTC(2026, 5, 1, 12, 0, 0),
  nowIso: '2026-06-01T12:00:00Z',
  in24hIso: '2026-06-02T12:00:00Z',
};

afterEach(() => { chains = []; });
beforeEach(() => { chains = []; });

describe('fetchStaffBadgeCount — Class A swap (PR #125)', () => {
  it('a. queries team_players, never roster_members', async () => {
    const supabase = makeSupabaseMock({
      events: [{ id: 'e1', team_id: 't1', start_at: '2026-06-01T20:00:00Z' }],
    });
    await fetchStaffBadgeCount(supabase, baseArgs);
    const tables = chains.map((c) => c._table);
    expect(tables).toContain('team_players');
    expect(tables).not.toContain('roster_members');
  });

  it('b. filters by status=active (replaces left_at IS NULL)', async () => {
    const supabase = makeSupabaseMock({
      events: [{ id: 'e1', team_id: 't1', start_at: '2026-06-01T20:00:00Z' }],
    });
    await fetchStaffBadgeCount(supabase, baseArgs);
    const teamPlayersChain = chains.find((c) => c._table === 'team_players');
    expect(teamPlayersChain).toBeDefined();
    expect(teamPlayersChain._filters).toContainEqual(['eq', 'team_id', 't1']);
    expect(teamPlayersChain._filters).toContainEqual(['eq', 'status', 'active']);
    // Sanity: the legacy `.is('left_at', null)` is gone.
    const hasLeftAtIs = teamPlayersChain._filters.some((f) => f[0] === 'is' && f[1] === 'left_at');
    expect(hasLeftAtIs).toBe(false);
  });

  it('c. returns a numeric count with severity (zero events → count:0, severity:info)', async () => {
    const supabase = makeSupabaseMock({ events: [] });
    const result = await fetchStaffBadgeCount(supabase, baseArgs);
    expect(typeof result.count).toBe('number');
    expect(result.count).toBe(0);
    expect(result.severity).toBe('info');
  });
});

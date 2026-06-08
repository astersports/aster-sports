// @vitest-environment jsdom
//
// useRecentPlayedGames — the games_recap multi-game picker source. Locks the
// already-recapped exclusion (Frank-reported 2026-06-08): a game that appears
// in a sent game_recap (anchor_id) or games_recap (audience_filter.event_ids)
// drops out of the picker so it can't be recapped twice.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, renderHook, waitFor } from '@testing-library/react';

let byTable = {};

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: (table) => {
      const builder = {
        select: () => builder, eq: () => builder, lt: () => builder, gte: () => builder,
        order: () => builder, limit: () => builder, in: () => builder,
        then: (resolve) => resolve(byTable[table] || { data: [], error: null }),
      };
      return builder;
    },
  },
}));

const { useRecentPlayedGames } = await import('../useRecentPlayedGames');

const EVENTS = [
  { id: 'e1', start_at: '2026-06-05T17:00:00Z', opponent: '6th Boro', teams: { name: '10U Blue', org_id: 'org1' } },
  { id: 'e2', start_at: '2026-06-06T17:00:00Z', opponent: 'Storm', teams: { name: '10U Blue', org_id: 'org1' } },
  { id: 'e3', start_at: '2026-06-07T17:00:00Z', opponent: 'Hawks', teams: { name: '9U Boys', org_id: 'org1' } },
];
const RESULTS = [
  { event_id: 'e1', our_score: 22, opponent_score: 28, result: 'L', published_at: '2026-06-05T20:00:00Z' },
  { event_id: 'e2', our_score: 40, opponent_score: 20, result: 'W', published_at: '2026-06-06T20:00:00Z' },
  { event_id: 'e3', our_score: 30, opponent_score: 25, result: 'W', published_at: '2026-06-07T20:00:00Z' },
];

afterEach(() => { cleanup(); vi.clearAllMocks(); });
beforeEach(() => { byTable = { events: { data: EVENTS, error: null }, game_results: { data: RESULTS, error: null }, comms_messages: { data: [], error: null } }; });

describe('useRecentPlayedGames — already-recapped exclusion', () => {
  it('returns all played games when nothing has been recapped', async () => {
    const { result } = renderHook(() => useRecentPlayedGames('org1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.games.map((g) => g.id)).toEqual(['e1', 'e2', 'e3']);
  });

  it('excludes a game already in a sent games_recap (audience_filter.event_ids)', async () => {
    byTable.comms_messages = { data: [{ kind: 'games_recap', anchor_id: null, audience_filter: { event_ids: ['e1'] } }], error: null };
    const { result } = renderHook(() => useRecentPlayedGames('org1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.games.map((g) => g.id)).toEqual(['e2', 'e3']);
  });

  it('excludes a game already in a sent game_recap (anchor_id)', async () => {
    byTable.comms_messages = { data: [{ kind: 'game_recap', anchor_id: 'e2', audience_filter: null }], error: null };
    const { result } = renderHook(() => useRecentPlayedGames('org1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.games.map((g) => g.id)).toEqual(['e1', 'e3']);
  });

  it('excludes across both recap kinds at once', async () => {
    byTable.comms_messages = { data: [
      { kind: 'games_recap', anchor_id: null, audience_filter: { event_ids: ['e1', 'e3'] } },
      { kind: 'game_recap', anchor_id: 'e2', audience_filter: null },
    ], error: null };
    const { result } = renderHook(() => useRecentPlayedGames('org1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.games).toEqual([]);
  });

  it('surfaces empty (not stale) when the recap query errors (AP#36)', async () => {
    byTable.comms_messages = { data: null, error: { message: 'boom' } };
    const { result } = renderHook(() => useRecentPlayedGames('org1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.games).toEqual([]);
  });
});

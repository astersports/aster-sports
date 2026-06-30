// pickNextGame / pickUpcoming — upcoming games across all tracked teams' merged
// schedules (R1·PR-A Hub up-next hero). Locks: finals + past games excluded,
// the GLOBAL minimum future start wins even when the RPC interleaves teams, and
// pickUpcoming returns the soonest-first window for the on-deck mini box.

import { describe, expect, it } from 'vitest';
import { pickNextGame, pickUpcoming } from '../nextGame';

const NOW = Date.UTC(2026, 5, 30, 12, 0, 0); // 2026-06-30T12:00Z

describe('pickNextGame', () => {
  it('returns null for empty / non-array input', () => {
    expect(pickNextGame([], NOW)).toBeNull();
    expect(pickNextGame(null, NOW)).toBeNull();
  });

  it('ignores finals and past games', () => {
    const games = [
      { gameId: 'a', status: 'final', startAt: '2026-07-01T18:00:00Z' },
      { gameId: 'b', status: 'scheduled', startAt: '2026-06-01T18:00:00Z' }, // past
    ];
    expect(pickNextGame(games, NOW)).toBeNull();
  });

  it('picks the global soonest future game across interleaved teams', () => {
    const games = [
      { gameId: 'far', status: 'scheduled', startAt: '2026-08-18T18:00:00Z', trackedTeamName: 'Storm Blue' },
      { gameId: 'soon', status: 'scheduled', startAt: '2026-07-02T14:00:00Z', trackedTeamName: 'Storm Pink' },
      { gameId: 'mid', status: 'scheduled', startAt: '2026-07-10T14:00:00Z', trackedTeamName: 'Storm Black' },
    ];
    const next = pickNextGame(games, NOW);
    expect(next.gameId).toBe('soon');
    expect(next.trackedTeamName).toBe('Storm Pink');
  });

  it('skips rows with a missing or unparseable start', () => {
    const games = [
      { gameId: 'bad', status: 'scheduled', startAt: null },
      { gameId: 'ok', status: 'scheduled', startAt: '2026-07-05T14:00:00Z' },
    ];
    expect(pickNextGame(games, NOW).gameId).toBe('ok');
  });
});

describe('pickUpcoming', () => {
  const games = [
    { gameId: 'far', status: 'scheduled', startAt: '2026-08-18T18:00:00Z' },
    { gameId: 'soon', status: 'scheduled', startAt: '2026-07-02T14:00:00Z' },
    { gameId: 'mid', status: 'scheduled', startAt: '2026-07-10T14:00:00Z' },
    { gameId: 'past', status: 'scheduled', startAt: '2026-06-01T14:00:00Z' },
    { gameId: 'done', status: 'final', startAt: '2026-07-03T14:00:00Z' },
  ];

  it('returns future non-final games soonest-first, capped at the limit', () => {
    expect(pickUpcoming(games, NOW, 3).map((g) => g.gameId)).toEqual(['soon', 'mid', 'far']);
    expect(pickUpcoming(games, NOW, 2).map((g) => g.gameId)).toEqual(['soon', 'mid']);
  });

  it('returns [] for empty / non-array input', () => {
    expect(pickUpcoming([], NOW)).toEqual([]);
    expect(pickUpcoming(null, NOW)).toEqual([]);
  });
});

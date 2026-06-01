// Tier 3 v1 PR 5 — conflictAdapter tests.
//
// Covers: one block per kid×team; events filtered to that team +
// non-cancelled + has start_at; missing team in teamsById falls
// back to defaults; empty inputs return [].

import { describe, expect, it } from 'vitest';
import { toKidsWithEvents } from '../conflictAdapter';

const teamsById = {
  'team-a': { id: 'team-a', name: '11U Girls', team_color: '#4a8fd4', sort_order: 1 },
  'team-b': { id: 'team-b', name: '10U Black', team_color: '#000000', sort_order: 2 },
};

describe('toKidsWithEvents', () => {
  it('returns [] when myChildren is empty', () => {
    expect(toKidsWithEvents([], [], teamsById)).toEqual([]);
  });

  it('returns [] when myChildren is null', () => {
    expect(toKidsWithEvents(null, [], teamsById)).toEqual([]);
  });

  it('produces one block per kid×team', () => {
    const kids = [
      { playerId: 'p1', firstName: 'Aria', teamId: 'team-a' },
      { playerId: 'p2', firstName: 'Beck', teamIds: ['team-a', 'team-b'] },
    ];
    const out = toKidsWithEvents(kids, [], teamsById);
    expect(out).toHaveLength(3);
    expect(out.map((b) => `${b.player_id}|${b.team_id}`)).toEqual(['p1|team-a', 'p2|team-a', 'p2|team-b']);
  });

  it('attaches team metadata from teamsById', () => {
    const out = toKidsWithEvents([{ playerId: 'p1', firstName: 'Aria', teamId: 'team-a' }], [], teamsById);
    expect(out[0].team_name).toBe('11U Girls');
    expect(out[0].team_color).toBe('#4a8fd4');
    expect(out[0].sort_order).toBe(1);
  });

  it('falls back to defaults when team is missing from teamsById', () => {
    const out = toKidsWithEvents([{ playerId: 'p1', firstName: 'Aria', teamId: 'team-unknown' }], [], teamsById);
    expect(out[0].team_name).toBe('—');
    expect(out[0].team_color).toBe('var(--as-neutral)');
    expect(out[0].sort_order).toBe(999);
  });

  it('filters events to those matching team_id + non-cancelled + has start_at', () => {
    const kids = [{ playerId: 'p1', firstName: 'Aria', teamId: 'team-a' }];
    const events = [
      { id: 'e1', team_id: 'team-a', start_at: '2026-05-20T10:00:00Z', status: 'scheduled' },
      { id: 'e2', team_id: 'team-b', start_at: '2026-05-20T11:00:00Z', status: 'scheduled' },
      { id: 'e3', team_id: 'team-a', start_at: '2026-05-21T10:00:00Z', status: 'cancelled' },
      { id: 'e4', team_id: 'team-a', start_at: null, status: 'scheduled' },
    ];
    const out = toKidsWithEvents(kids, events, teamsById);
    expect(out[0].events.map((e) => e.id)).toEqual(['e1']);
  });

  it('skips kids with no team association', () => {
    const kids = [{ playerId: 'p-orphan', firstName: 'Sam' }];
    expect(toKidsWithEvents(kids, [], teamsById)).toEqual([]);
  });
});

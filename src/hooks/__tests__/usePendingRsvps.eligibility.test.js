// @vitest-environment jsdom
//
// B2 gate (design system D4/D5, operator-caught round 6): the Home
// Needs-You stack must never prompt an RSVP a kid cannot answer — an
// unactivated academy kid's GAME pair is INELIGIBLE, not pending.
// Practices stay pending (practices ARE the academy program).

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, renderHook, waitFor } from '@testing-library/react';

const h = vi.hoisted(() => ({ activations: [] }));

vi.mock('../../lib/supabase', () => {
  const makeQuery = (table) => {
    const q = {};
    ['select', 'eq', 'in'].forEach((m) => { q[m] = () => q; });
    q.then = (res) => Promise.resolve({ data: table === 'player_activations' ? h.activations : [], error: null }).then(res);
    return q;
  };
  return { supabase: { from: (t) => makeQuery(t) } };
});

import { usePendingRsvps } from '../usePendingRsvps';

afterEach(cleanup);

const KIDS = [
  { playerId: 'p-rostered', firstName: 'Charlie', teamIds: ['t-1'], memberType: 'roster' },
  { playerId: 'p-academy', firstName: 'Milo', teamIds: ['t-1'], memberType: 'futures_academy' },
];
const EVENTS = [
  { id: 'e-game', team_id: 't-1', event_type: 'game', start_at: new Date(Date.now() + 3600000).toISOString(), teams: { name: '8U Boys', team_color: '#f59e0b' } },
  { id: 'e-practice', team_id: 't-1', event_type: 'practice', start_at: new Date(Date.now() + 7200000).toISOString(), teams: { name: '8U Boys', team_color: '#f59e0b' } },
];

describe('usePendingRsvps — B2 academy eligibility', () => {
  it('unactivated academy kid: game pair EXCLUDED, practice pair stays; rostered kid unaffected', async () => {
    h.activations = [];
    const { result } = renderHook(() => usePendingRsvps(KIDS, EVENTS));
    await waitFor(() => expect(result.current.loading).toBe(false));
    const ids = result.current.pending.map((p) => `${p.event_id}:${p.player_id}`);
    expect(ids).toContain('e-game:p-rostered');
    expect(ids).toContain('e-practice:p-academy');
    expect(ids).not.toContain('e-game:p-academy');
  });

  it('ACTIVATED academy kid: the game pair is pending like anyone else', async () => {
    h.activations = [{ event_id: 'e-game', player_id: 'p-academy' }];
    const { result } = renderHook(() => usePendingRsvps(KIDS, EVENTS));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.pending.map((p) => `${p.event_id}:${p.player_id}`)).toContain('e-game:p-academy');
  });
});

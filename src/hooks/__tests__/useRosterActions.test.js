// @vitest-environment jsdom
//
// Teams PR-2 Part A — useRosterActions maps each action to the correct PR-0
// SECURITY DEFINER RPC with the exact param shape. A wrong RPC name or param
// key on a roster/money write is a silent data bug, so the contract is locked.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, renderHook } from '@testing-library/react';
import { act } from 'react';
import { useRosterActions } from '../useRosterActions';

const h = vi.hoisted(() => ({ calls: [], error: null }));

vi.mock('../../lib/supabase', () => ({
  supabase: { rpc: (fn, args) => { h.calls.push({ fn, args }); return Promise.resolve({ data: 'tp-1', error: h.error }); } },
}));

beforeEach(() => { h.calls.length = 0; h.error = null; });
afterEach(cleanup);

describe('useRosterActions — RPC contract', () => {
  it('addPlayer → add_roster_member (team/player/type/jersey) + refetches', async () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => useRosterActions('t-1', onChange));
    await act(async () => { await result.current.addPlayer('p-1', 'futures', 23); });
    expect(h.calls).toEqual([{ fn: 'add_roster_member', args: { p_team_id: 't-1', p_player_id: 'p-1', p_roster_type: 'futures', p_jersey: 23 } }]);
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('addPlayer defaults roster_type=rostered, jersey=null', async () => {
    const { result } = renderHook(() => useRosterActions('t-1', vi.fn()));
    await act(async () => { await result.current.addPlayer('p-1'); });
    expect(h.calls[0].args).toMatchObject({ p_roster_type: 'rostered', p_jersey: null });
  });

  it('removePlayer → drop_roster_member with mode', async () => {
    const { result } = renderHook(() => useRosterActions('t-1', vi.fn()));
    await act(async () => { await result.current.removePlayer('p-1', 'inactivate'); });
    expect(h.calls[0]).toEqual({ fn: 'drop_roster_member', args: { p_team_id: 't-1', p_player_id: 'p-1', p_mode: 'inactivate' } });
  });

  it('setJersey → set_jersey; setRosterType → set_roster_type', async () => {
    const { result } = renderHook(() => useRosterActions('t-1', vi.fn()));
    await act(async () => { await result.current.setJersey('p-1', 7); });
    await act(async () => { await result.current.setRosterType('p-1', 'rostered'); });
    expect(h.calls[0]).toEqual({ fn: 'set_jersey', args: { p_team_id: 't-1', p_player_id: 'p-1', p_jersey: 7 } });
    expect(h.calls[1]).toEqual({ fn: 'set_roster_type', args: { p_team_id: 't-1', p_player_id: 'p-1', p_type: 'rostered' } });
  });

  it('throws on rpc error and does NOT refetch', async () => {
    h.error = { message: 'NOT_AUTHORIZED' };
    const onChange = vi.fn();
    const { result } = renderHook(() => useRosterActions('t-1', onChange));
    let err;
    await act(async () => { try { await result.current.addPlayer('p-1'); } catch (e) { err = e; } });
    expect(err?.message).toBe('NOT_AUTHORIZED');
    expect(onChange).not.toHaveBeenCalled();
  });
});

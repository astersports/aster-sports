// @vitest-environment jsdom
//
// Wave 4.8 6c Session 3 — useInboxQueue RPC contract.
// Mocks supabase.rpc; assertions wait on the data shape after the
// deferred Promise.resolve().then() write lands.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, renderHook, waitFor } from '@testing-library/react';

let resolveData = { data: [], error: null };
const rpcSpy = vi.fn();

vi.mock('../../lib/supabase', () => ({
  supabase: {
    rpc: (...a) => { rpcSpy(...a); return Promise.resolve(resolveData); },
  },
}));

const { useInboxQueue } = await import('../useInboxQueue');

afterEach(() => { cleanup(); vi.clearAllMocks(); });
beforeEach(() => { resolveData = { data: [], error: null }; rpcSpy.mockClear(); });

describe('useInboxQueue — RPC pass-through', () => {
  it('a. calls briefing_active_queue with the full param tuple', async () => {
    renderHook(() => useInboxQueue({ orgId: 'org-1', kind: 'game_recap', teamIds: ['t1', 't2'], dateRange: 'last_30_days' }));
    await waitFor(() => expect(rpcSpy).toHaveBeenCalled());
    expect(rpcSpy).toHaveBeenCalledWith('briefing_active_queue', {
      p_org_id: 'org-1',
      p_kind: 'game_recap',
      p_team_ids: ['t1', 't2'],
      p_date_range: 'last_30_days',
    });
  });

  it('b. maps non-RPC date_range values ("today" → "this_week")', async () => {
    renderHook(() => useInboxQueue({ orgId: 'org-1', dateRange: 'today' }));
    await waitFor(() => expect(rpcSpy).toHaveBeenCalled());
    expect(rpcSpy.mock.calls[0][1].p_date_range).toBe('this_week');
  });

  it('c. maps "next_7_days" to "last_14_days"', async () => {
    renderHook(() => useInboxQueue({ orgId: 'org-1', dateRange: 'next_7_days' }));
    await waitFor(() => expect(rpcSpy).toHaveBeenCalled());
    expect(rpcSpy.mock.calls[0][1].p_date_range).toBe('last_14_days');
  });

  it('d. coerces empty teamIds array to null (clean filter, no chip selected)', async () => {
    renderHook(() => useInboxQueue({ orgId: 'org-1', teamIds: [] }));
    await waitFor(() => expect(rpcSpy).toHaveBeenCalled());
    expect(rpcSpy.mock.calls[0][1].p_team_ids).toBe(null);
  });

  it('e. short-circuits without orgId (no RPC call, rows=[])', async () => {
    const { result } = renderHook(() => useInboxQueue({ orgId: null }));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(rpcSpy).not.toHaveBeenCalled();
    expect(result.current.rows).toEqual([]);
  });

  it('f. returns mixed-source rows verbatim (DB-backed + synthetic)', async () => {
    resolveData = {
      data: [
        { id: 'msg-1', source: 'comms_messages', kind: 'game_recap', status: 'draft', anchor_id: 'evt-1' },
        { id: null, source: 'synthetic', kind: 'tournament_prelim', status: 'needs_briefing', anchor_id: 't-2' },
      ],
      error: null,
    };
    const { result } = renderHook(() => useInboxQueue({ orgId: 'org-1' }));
    await waitFor(() => expect(result.current.rows.length).toBe(2));
    expect(result.current.rows[0].source).toBe('comms_messages');
    expect(result.current.rows[1].source).toBe('synthetic');
  });

  it('g. on RPC error: rows cleared to [] and error set (PR #114 regression class)', async () => {
    resolveData = { data: null, error: { message: 'RPC failed' } };
    const { result } = renderHook(() => useInboxQueue({ orgId: 'org-1' }));
    await waitFor(() => expect(result.current.error).not.toBe(null));
    expect(result.current.rows).toEqual([]);
  });
});

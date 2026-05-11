// @vitest-environment jsdom
//
// Wave 4.4-B Session 5d-b-1 — useOrgTeams hook test.
// Mocks supabase + useAuth via vi.mock; exercises the hook via
// renderHook + waitFor (available since RTL infra landed in C2b / PR #103).

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, renderHook, waitFor } from '@testing-library/react';

let orgIdValue = 'org-1';
let resolveData = { data: [], error: null };
const fromFn = vi.fn();
const orderFn = vi.fn();

function chain() {
  return { order: (...a) => { orderFn(...a); return Promise.resolve(resolveData); } };
}

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: (...a) => {
      fromFn(...a);
      return { select: () => ({ eq: () => chain() }) };
    },
  },
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ orgId: orgIdValue }),
}));

const { useOrgTeams } = await import('../useOrgTeams');

afterEach(() => { cleanup(); vi.clearAllMocks(); });
beforeEach(() => { orgIdValue = 'org-1'; resolveData = { data: [], error: null }; });

describe('useOrgTeams', () => {
  it('a. returns teams in sort_order on success', async () => {
    resolveData = {
      data: [
        { id: 't-1', name: '11U Girls', sort_order: 1 },
        { id: 't-2', name: '10U Black', sort_order: 2 },
      ],
      error: null,
    };
    const { result } = renderHook(() => useOrgTeams());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.teams).toHaveLength(2);
    expect(orderFn).toHaveBeenCalledWith('sort_order', { ascending: true });
    expect(fromFn).toHaveBeenCalledWith('teams');
  });

  it('b. returns empty array + loading=false when orgId is null', async () => {
    orgIdValue = null;
    const { result } = renderHook(() => useOrgTeams());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.teams).toEqual([]);
    expect(fromFn).not.toHaveBeenCalled();
  });

  it('c. returns empty array + loading=false on query error', async () => {
    resolveData = { data: null, error: { message: 'fetch failed' } };
    const { result } = renderHook(() => useOrgTeams());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.teams).toEqual([]);
  });
});

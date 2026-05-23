// @vitest-environment jsdom
//
// Wave 4.4-B Session 5d-b-2 — useFavoriteAudiences hook test.
// Mocks supabase + useAuth; exercises add/remove + initial load
// branches via renderHook (RTL infra from C2b PR #103).

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';

let initialFavorites = null;
const upsertFn = vi.fn(() => Promise.resolve({ error: null }));

function selectChain() {
  // Phase Alpha audit PR #208 added .eq('org_id', orgId) after .eq('user_id', userId).
  // Mock supports chained .eq() calls by returning the same shape recursively.
  const eqShape = {
    eq: () => eqShape,
    maybeSingle: () => Promise.resolve({ data: initialFavorites === null ? null : { favorite_audiences: initialFavorites }, error: null }),
  };
  return {
    select: () => eqShape,
    upsert: (...a) => { upsertFn(...a); return Promise.resolve({ error: null }); },
  };
}

vi.mock('../../lib/supabase', () => ({
  supabase: { from: () => selectChain() },
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ orgId: 'org-1', user: { id: 'user-1' } }),
}));

const { useFavoriteAudiences } = await import('../useFavoriteAudiences');

afterEach(() => { cleanup(); vi.clearAllMocks(); });
beforeEach(() => { initialFavorites = null; });

describe('useFavoriteAudiences', () => {
  it('a. add() appends entry + persists via upsert with onConflict user_id,org_id (composite PK)', async () => {
    initialFavorites = [];
    const { result } = renderHook(() => useFavoriteAudiences());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => { await result.current.add('team', { team_ids: ['t-1'] }, 'My team'); });
    expect(result.current.favorites).toHaveLength(1);
    expect(result.current.favorites[0].label).toBe('My team');
    expect(result.current.favorites[0].audience_type).toBe('team');
    expect(result.current.favorites[0].id).toBeTruthy();
    const upsertCall = upsertFn.mock.calls[0];
    expect(upsertCall[0]).toMatchObject({ user_id: 'user-1', org_id: 'org-1' });
    expect(upsertCall[1]).toEqual({ onConflict: 'user_id,org_id' });
  });

  it('b. remove(id) filters favorites + persists', async () => {
    initialFavorites = [
      { id: 'f-1', label: 'A', audience_type: 'team', audience_filter: {} },
      { id: 'f-2', label: 'B', audience_type: 'org_all', audience_filter: null },
    ];
    const { result } = renderHook(() => useFavoriteAudiences());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.favorites).toHaveLength(2);
    await act(async () => { await result.current.remove('f-1'); });
    expect(result.current.favorites).toHaveLength(1);
    expect(result.current.favorites[0].id).toBe('f-2');
  });

  it('c. initial load: returns [] when user_preferences row does not exist yet', async () => {
    initialFavorites = null;
    const { result } = renderHook(() => useFavoriteAudiences());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.favorites).toEqual([]);
  });
});

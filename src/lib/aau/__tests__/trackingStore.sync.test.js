// @vitest-environment jsdom
//
// trackingStore — the SIGNED-IN sync path (R1·PR-A, DR-P). Covers what the anon
// localStorage suite can't: loading the account list on init, merging the local
// list onto the account at sign-in, optimistic DB writes on toggle, and the
// fall-back to localStorage on sign-out. supabase is mocked per-test (the store
// imports it dynamically), with fresh module state via vi.resetModules.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const STORAGE_KEY = 'aau:tracked-teams:v1';
const tick = () => new Promise((r) => setTimeout(r, 0));

function makeSupabase({ sessionUser = null, dbRows = [] } = {}) {
  const calls = { upsert: [], delete: [] };
  let authCb = null;
  const supabase = {
    auth: {
      getSession: async () => ({ data: { session: sessionUser ? { user: sessionUser } : null } }),
      onAuthStateChange: (cb) => { authCb = cb; return { data: { subscription: { unsubscribe() {} } } }; },
      signOut: async () => ({ error: null }),
    },
    from: (table) => ({
      select: () => ({ eq: async () => ({ data: dbRows, error: null }) }),
      upsert: async (rows) => { calls.upsert.push({ table, rows: Array.isArray(rows) ? rows : [rows] }); return { error: null }; },
      delete: () => ({ eq: () => ({ eq: async () => { calls.delete.push(table); return { error: null }; } }) }),
    }),
  };
  return { supabase, calls, fireAuth: (u) => authCb && authCb('e', u ? { user: u } : null) };
}

async function loadStore(mock) {
  vi.resetModules();
  vi.doMock('../../supabase', () => ({ supabase: mock.supabase }));
  return import('../trackingStore');
}

beforeEach(() => localStorage.clear());
afterEach(() => { vi.resetModules(); vi.doUnmock('../../supabase'); localStorage.clear(); });

describe('trackingStore — signed-in sync', () => {
  it('loads the account list (tracked_teams) on a signed-in init', async () => {
    const mock = makeSupabase({ sessionUser: { id: 'u1', email: 'f@x.co' }, dbRows: [{ team_key: 'a::', name: 'A' }] });
    const store = await loadStore(mock);
    await store.ensureTrackingInit();
    expect(store.isHubSignedIn()).toBe(true);
    expect(store.getTrackedTeams()).toEqual([{ teamKey: 'a::', name: 'A' }]);
  });

  it('merges the anon local list onto the account at sign-in', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([{ teamKey: 'local::', name: 'Local' }]));
    const mock = makeSupabase({ sessionUser: { id: 'u1' }, dbRows: [] });
    const store = await loadStore(mock);
    await store.ensureTrackingInit();
    const merged = mock.calls.upsert.find((c) => c.table === 'tracked_teams' && c.rows.some((r) => r.team_key === 'local::'));
    expect(merged).toBeTruthy();
    expect(merged.rows[0]).toMatchObject({ user_id: 'u1', team_key: 'local::', name: 'Local' });
  });

  it('writes toggles to tracked_teams (optimistic insert then delete)', async () => {
    const mock = makeSupabase({ sessionUser: { id: 'u1' }, dbRows: [] });
    const store = await loadStore(mock);
    await store.ensureTrackingInit();
    expect(store.toggleTrackedTeam({ teamKey: 'b::', name: 'B' })).toBe(true); // optimistic + synchronous
    expect(store.isTeamTracked('b::')).toBe(true);
    await tick();
    expect(mock.calls.upsert.some((c) => c.table === 'tracked_teams' && c.rows.some((r) => r.team_key === 'b::'))).toBe(true);
    store.toggleTrackedTeam({ teamKey: 'b::' });
    await tick();
    expect(mock.calls.delete).toContain('tracked_teams');
  });

  it('falls back to localStorage on sign-out', async () => {
    const mock = makeSupabase({ sessionUser: { id: 'u1' }, dbRows: [{ team_key: 'db::', name: 'DB' }] });
    const store = await loadStore(mock);
    await store.ensureTrackingInit();
    expect(store.isHubSignedIn()).toBe(true);
    localStorage.setItem(STORAGE_KEY, JSON.stringify([{ teamKey: 'loc::', name: 'Loc' }]));
    mock.fireAuth(null); // SIGNED_OUT
    await tick();
    expect(store.isHubSignedIn()).toBe(false);
    expect(store.getTrackedTeams()).toEqual([{ teamKey: 'loc::', name: 'Loc' }]);
  });
});

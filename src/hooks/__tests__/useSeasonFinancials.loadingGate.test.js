// @vitest-environment jsdom
//
// useSeasonFinancials — stale-gate loading test.
//
// Locks the §4.G Cluster 6.A2 regression (2026-05-20 PM, originally
// surfaced on the removed useAdminStats/KpiGrid surface — same shape
// here on the current shared hook).
//
// Pre-fix: when `seasonId` changed, the hook returned
// `{ accounts: <prev>, loading: false }` for one render before the
// microtask-deferred refetch flipped `setLoading(true)`. Consumers
// like FinancialDashboardPage that gate on `loading` rendered the
// prior season's accounts in the new season's tab for one frame.
//
// Fix: `fetchedKeyRef` records the (orgId,seasonId,guardianId) of the
// last completed fetch; `isStale` is derived in render and folded
// into the visible `loading`. As soon as deps change, the hook
// reports loading=true + zeroed accounts/stats — no microtask wait.
//
// Same shape as useAlertEvaluator.loadingGate.test.js (PR #241,
// anti-pattern #43). When seasonId-change refetch ever forgets the
// null/key short-circuit again, this test fails.

import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';

let resolvers = [];
const accountsForSeason = {
  's-A': [{ id: 'a1', org_id: 'o', season_id: 's-A', guardians: null }],
  's-B': [{ id: 'a2', org_id: 'o', season_id: 's-B', guardians: null }],
};
// Money sources from the family_balances view now (F-1 / STEP 1).
const balancesForSeason = {
  's-A': [{ account_id: 'a1', billed_cents: 70000, net_paid_cents: 0, total_fees_cents: 0, balance_cents: 70000 }],
  's-B': [{ account_id: 'a2', billed_cents: 50000, net_paid_cents: 0, total_fees_cents: 0, balance_cents: 50000 }],
};

vi.mock('../../lib/supabase', () => {
  const buildChain = (table) => {
    let capturedSeasonId = null;
    const chain = {
      select: () => chain,
      eq: (col, val) => {
        if (col === 'season_id') capturedSeasonId = val;
        return chain;
      },
      order: () => chain,
      then: (cb) => {
        let data = [];
        if (table === 'financial_accounts') data = accountsForSeason[capturedSeasonId] || [];
        else if (table === 'family_balances') data = balancesForSeason[capturedSeasonId] || [];
        // Hand control of resolution to the test: push a resolver that
        // the test can drain via act() to advance the fetch.
        return new Promise((resolve) => {
          resolvers.push(() => resolve({ data, error: null }));
        }).then(cb);
      },
    };
    return chain;
  };
  return { supabase: { from: (table) => buildChain(table) } };
});

const drainResolvers = async () => {
  // Wait for the refetch's microtask to enqueue both queries (accounts +
  // family_balances). The refetch is scheduled via Promise.resolve().then()
  // inside useEffect, so it lands one task tick after the render.
  await waitFor(() => expect(resolvers.length).toBeGreaterThanOrEqual(2));
  await act(async () => {
    resolvers.splice(0).forEach((r) => r());
    // Yield so the resolved promises propagate through await chains.
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
};

const { useSeasonFinancials } = await import('../useSeasonFinancials');

afterEach(() => { cleanup(); resolvers = []; });

describe('useSeasonFinancials — stale-gate (Cluster 6.A2)', () => {
  it('reports loading=true synchronously on seasonId change, before microtask refetch', async () => {
    const { result, rerender } = renderHook(({ seasonId }) => useSeasonFinancials('o', seasonId), {
      initialProps: { seasonId: 's-A' },
    });
    await drainResolvers();
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.accounts).toHaveLength(1);
    expect(result.current.accounts[0].id).toBe('a1');

    // Switch to season B — loading must flip to true on the SAME render,
    // not after a microtask. accounts must NOT expose season A's data.
    rerender({ seasonId: 's-B' });
    expect(result.current.loading).toBe(true);
    expect(result.current.accounts).toEqual([]);
    expect(result.current.stats.billed).toBe(0);

    // Drain the in-flight fetch; should now reflect season B.
    await drainResolvers();
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.accounts).toHaveLength(1);
    expect(result.current.accounts[0].id).toBe('a2');
    expect(result.current.stats.billed).toBe(50000);
  });

  it('stays loading=true until orgId + seasonId both resolve', async () => {
    const { result, rerender } = renderHook(({ orgId, seasonId }) => useSeasonFinancials(orgId, seasonId), {
      initialProps: { orgId: null, seasonId: null },
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.accounts).toEqual([]);

    rerender({ orgId: 'o', seasonId: 's-A' });
    expect(result.current.loading).toBe(true);

    await drainResolvers();
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.accounts).toHaveLength(1);
  });
});

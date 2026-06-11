// @vitest-environment jsdom
//
// Unit tests for the computation logic in useSeasonFinancials. Pulls
// the hook through renderHook + mocks supabase.from to return fixture
// data, then asserts the derived { balances, stats } match expected
// values for a controlled set of family_balances view rows.
//
// Money now sources entirely from the family_balances VIEW (F-1 /
// MONEY_SEAM_AUDIT 2026-06-11 STEP 1) — the view reconciles BOTH
// billing models, so the funnel fixture (a3) exercises the exact case
// the old raw-column math got wrong (billed from a 'fee' txn, not from
// season_fee_cents). Locks the contract between FinancialDashboardPage
// and AdminHomePage PendingQueuesLanes — both consume this hook, so the
// balance math is the single source of truth per anti-pattern #42.

import { describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

// Account metadata (names) — unchanged shape, used for the family list.
const accountsFixture = [
  { id: 'a1', org_id: 'o', season_id: 's', guardians: { first_name: 'A', last_name: 'One', user_id: 'u1' } },
  { id: 'a2', org_id: 'o', season_id: 's', guardians: { first_name: 'B', last_name: 'Two', user_id: 'u2' } },
  { id: 'a3', org_id: 'o', season_id: 's', guardians: { first_name: 'C', last_name: 'Three', user_id: 'u3' } },
];

// family_balances view rows — the canonical money source. bigint columns
// (net_paid/total_fees/balance) arrive as numbers from supabase-js; the
// hook coerces defensively. a1 = imported, fully paid. a2 = imported,
// 30k owing. a3 = FUNNEL (billed via a 'fee' txn) 50k unpaid — the old
// raw-column path would have read season_fee_cents=0 and shown billed 0.
const balancesFixture = [
  { account_id: 'a1', billed_cents: 70000, net_paid_cents: 70000, total_fees_cents: 2000, balance_cents: 0 },
  { account_id: 'a2', billed_cents: 60000, net_paid_cents: 30000, total_fees_cents: 1000, balance_cents: 30000 },
  { account_id: 'a3', billed_cents: 50000, net_paid_cents: 0, total_fees_cents: 0, balance_cents: 50000 },
];

vi.mock('../../lib/supabase', () => {
  const buildChain = (resolveData) => {
    const chain = {
      select: () => chain,
      eq: () => chain,
      order: () => chain,
      then: (cb) => Promise.resolve({ data: resolveData, error: null }).then(cb),
    };
    return chain;
  };
  return {
    supabase: {
      from: (table) => {
        if (table === 'financial_accounts') return buildChain(accountsFixture);
        if (table === 'family_balances') return buildChain(balancesFixture);
        return buildChain([]);
      },
    },
  };
});

const { useSeasonFinancials } = await import('../useSeasonFinancials');

describe('useSeasonFinancials computation', () => {
  it('computes balances, stats, and familiesOwing from the family_balances view', async () => {
    const { result } = renderHook(() => useSeasonFinancials('o', 's'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.balances).toEqual({ a1: 0, a2: 30000, a3: 50000 });

    // byAccount exposes per-account view money (F-2: FamilyBalanceList reads
    // billed/net_paid here, not raw season_fee/discount columns).
    expect(result.current.byAccount).toEqual({
      a1: { billed: 70000, netPaid: 70000, balance: 0 },
      a2: { billed: 60000, netPaid: 30000, balance: 30000 },
      a3: { billed: 50000, netPaid: 0, balance: 50000 }, // funnel
    });

    const { stats } = result.current;
    expect(stats.billed).toBe(70000 + 60000 + 50000); // 180000 (incl. funnel a3)
    expect(stats.paid).toBe(70000 + 30000); // 100000
    expect(stats.fees).toBe(3000);
    expect(stats.net).toBe(97000);
    expect(stats.outstanding).toBe(80000); // sum of balance_cents
    expect(stats.familiesOwing).toBe(2); // a2 + a3
    expect(stats.pct).toBe(56); // 100k / 180k = 0.555... → 56
  });

  it('returns empty stats when no orgId or seasonId', async () => {
    const { result } = renderHook(() => useSeasonFinancials(null, null));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.stats.familiesOwing).toBe(0);
    expect(result.current.stats.billed).toBe(0);
    expect(result.current.balances).toEqual({});
  });
});

// @vitest-environment jsdom
//
// Unit tests for the computation logic in useSeasonFinancials. Pulls
// the hook through renderHook + mocks supabase.from to return fixture
// data, then asserts the derived { balances, stats } match expected
// values for a controlled set of accounts + transactions.
//
// Locks the contract between FinancialDashboardPage and AdminHomePage
// PendingQueuesLanes — both consume from this hook, so the balance
// math is the single source of truth per anti-pattern #42.

import { describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

const accountsFixture = [
  { id: 'a1', org_id: 'o', season_id: 's', season_fee_cents: 70000, discount_cents: 0, guardians: { first_name: 'A', last_name: 'One', user_id: 'u1' } },
  { id: 'a2', org_id: 'o', season_id: 's', season_fee_cents: 70000, discount_cents: 10000, guardians: { first_name: 'B', last_name: 'Two', user_id: 'u2' } },
  { id: 'a3', org_id: 'o', season_id: 's', season_fee_cents: 50000, discount_cents: 0, guardians: { first_name: 'C', last_name: 'Three', user_id: 'u3' } },
];

const transactionsFixture = [
  // a1 fully paid (70k expected, 70k paid)
  { account_id: 'a1', transaction_type: 'payment', amount_cents: 70000, processing_fee_cents: 2000, occurred_at: '2026-05-01' },
  // a2 partially paid (60k expected, 30k paid → 30k owing)
  { account_id: 'a2', transaction_type: 'payment', amount_cents: 30000, processing_fee_cents: 1000, occurred_at: '2026-05-02' },
  // a3 unpaid entirely (50k expected, 0 paid → 50k owing)
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
        if (table === 'financial_transactions') return buildChain(transactionsFixture);
        return buildChain([]);
      },
    },
  };
});

const { useSeasonFinancials } = await import('../useSeasonFinancials');

describe('useSeasonFinancials computation', () => {
  it('computes balances, stats, and familiesOwing from accounts + transactions', async () => {
    const { result } = renderHook(() => useSeasonFinancials('o', 's'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.balances).toEqual({ a1: 0, a2: 30000, a3: 50000 });

    const { stats } = result.current;
    expect(stats.billed).toBe(70000 + 60000 + 50000); // 180000
    expect(stats.paid).toBe(70000 + 30000); // 100000
    expect(stats.fees).toBe(3000);
    expect(stats.net).toBe(97000);
    expect(stats.outstanding).toBe(80000);
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

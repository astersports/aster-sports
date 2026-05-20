import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

// §4.C Sprint D — shared source of truth for season financial state.
// Pulls accounts + transactions for an (org_id, season_id), computes
// per-account balance map + aggregate stats. Two consumers today:
//   - FinancialDashboardPage (full UI: stats cards + family list)
//   - AdminHomePage PendingQueuesLanes (just the count of families
//     owing, for the third lane per HOME_DESIGN_SPEC §3.1.4)
//
// Originally the computation lived inline at FinancialDashboardPage
// :57-69. Extracted in this PR per anti-pattern #42 to avoid
// parallel-system buildup — if the admin-home lane re-implemented
// "families owing" with its own query, two computations could
// silently disagree on the same business question.
//
// Naming note: ledger entry §4.Q used `useFamiliesOwing` as the
// candidate name. Final hook is `useSeasonFinancials` because it
// returns the broader state (stats + balances + accounts +
// transactions), not just the count. The count is one field
// (`stats.familiesOwing`); the lane consumer uses it directly.
//
// Per anti-pattern #36 (data + error destructured separately) +
// #37 (org_id filter first on the chain).

const EMPTY_STATS = { billed: 0, paid: 0, fees: 0, net: 0, outstanding: 0, familiesOwing: 0, pct: 0 };

export function useSeasonFinancials(orgId, seasonId) {
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fetchIdRef = useRef(0);

  const refetch = useCallback(async () => {
    if (!orgId || !seasonId) {
      setAccounts([]);
      setTransactions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const id = ++fetchIdRef.current;
    const [aRes, tRes] = await Promise.all([
      supabase
        .from('financial_accounts')
        .select('*, guardians(first_name, last_name, user_id)')
        .eq('org_id', orgId)
        .eq('season_id', seasonId),
      supabase
        .from('financial_transactions')
        .select('*')
        .eq('org_id', orgId)
        .order('occurred_at', { ascending: false }),
    ]);
    if (id !== fetchIdRef.current) return;
    if (aRes.error || tRes.error) {
      const msg = aRes.error?.message || tRes.error?.message;
      console.error('useSeasonFinancials fetch:', msg);
      setError(msg);
      setAccounts([]);
      setTransactions([]);
      setLoading(false);
      return;
    }
    const accts = aRes.data || [];
    const acctIds = new Set(accts.map((a) => a.id));
    setError(null);
    setAccounts(accts);
    setTransactions((tRes.data || []).filter((t) => acctIds.has(t.account_id)));
    setLoading(false);
  }, [orgId, seasonId]);

  useEffect(() => { Promise.resolve().then(refetch); }, [refetch]);

  // Single computation of per-account balance + aggregate stats.
  // Memoized off accounts + transactions so consumers don't recompute
  // on every render (PR #126 stabilization concern).
  const { balances, stats } = useMemo(() => {
    if (!accounts.length) return { balances: {}, stats: EMPTY_STATS };
    let billed = 0; let paid = 0; let fees = 0;
    const bal = {};
    accounts.forEach((a) => {
      const expected = a.season_fee_cents - a.discount_cents;
      billed += expected;
      bal[a.id] = expected;
    });
    transactions.forEach((t) => {
      if (t.transaction_type === 'payment') {
        paid += t.amount_cents;
        fees += (t.processing_fee_cents || 0);
        bal[t.account_id] = (bal[t.account_id] || 0) - t.amount_cents;
      } else if (t.transaction_type === 'refund') {
        paid -= t.amount_cents;
        bal[t.account_id] = (bal[t.account_id] || 0) + t.amount_cents;
      }
    });
    const familiesOwing = accounts.filter((a) => (bal[a.id] || 0) > 0).length;
    return {
      balances: bal,
      stats: {
        billed, paid, fees,
        net: paid - fees,
        outstanding: billed - paid,
        familiesOwing,
        pct: billed > 0 ? Math.round((paid / billed) * 100) : 0,
      },
    };
  }, [accounts, transactions]);

  return { accounts, transactions, balances, stats, loading, error, refetch };
}

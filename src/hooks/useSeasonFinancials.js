import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

// §4.C Sprint D — shared source of truth for season financial state.
// Pulls accounts (names/metadata) + the family_balances VIEW for an
// (org_id, season_id), exposes a per-account balance map + aggregate
// stats. Three consumers today:
//   - FinancialDashboardPage (full UI: stats cards + family list)
//   - AdminHomePage PendingQueuesLanes (count of families owing, for
//     the third lane per HOME_DESIGN_SPEC §3.1.4)
//   - ParentHomePage RegistrationReminderCard (parent's own balance
//     via guardianId filter, per HOME_DESIGN_SPEC §1.1.9)
//
// Money read path (MONEY_SEAM_AUDIT 2026-06-11, F-1 / STEP 1): all
// billed/paid/fees/balance comes from the `family_balances` view —
// the ONE canonical source per #63 doctrine. The view reconciles BOTH
// billing models (imported fee-on-account + funnel fee-as-transaction),
// so funnel families bill correctly here. Previously this hook
// re-derived billed from the raw account fee minus discount columns
// plus a manual payment/refund loop that skipped 'fee' and 'adjustment'
// transactions — wrong for funnel accounts (billed=0, balance negative)
// and the last raw-column reader on the billing seam. The view also
// scopes by (org_id, season_id) itself, so the old org-wide
// transactions over-fetch (P1) is gone.
//
// Naming note: ledger entry §4.Q used `useFamiliesOwing` as the
// candidate name. Final hook is `useSeasonFinancials` because it
// returns the broader state (stats + balances + accounts).
//
// Per anti-pattern #36 (data + error destructured separately) +
// #37 (org_id filter first on the chain).
//
// Stale-gate (§4.G Cluster 6.A2, 2026-05-20 PM): consumers gate on
// `loading` but the microtask-deferred refetch left a one-render
// window with prior-season `accounts` + `loading=false`. Same shape
// as PR #241's useAlertEvaluator fix (anti-pattern #43). Fix: derive
// `isStale` in render from a (orgId,seasonId,guardianId) key vs. the
// last fetched key; visible `loading` is `loading || isStale`.

const EMPTY_STATS = { billed: 0, paid: 0, fees: 0, net: 0, outstanding: 0, familiesOwing: 0, pct: 0 };

function keyFor(orgId, seasonId, guardianId) {
  if (!orgId || !seasonId) return null;
  return `${orgId}:${seasonId}:${guardianId || ''}`;
}

export function useSeasonFinancials(orgId, seasonId, guardianId = null) {
  const [accounts, setAccounts] = useState([]);
  const [balanceRows, setBalanceRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // fetchedKey lives in state (not a ref) so that comparing it to
  // currentKey in render is lint-clean and reactive: the next render
  // after a successful fetch picks up the new key and flips isStale.
  const [fetchedKey, setFetchedKey] = useState(null);
  const fetchIdRef = useRef(0);

  const currentKey = keyFor(orgId, seasonId, guardianId);
  const isStale = currentKey !== null && fetchedKey !== currentKey;

  const refetch = useCallback(async () => {
    if (!orgId || !seasonId) {
      setAccounts([]);
      setBalanceRows([]);
      setFetchedKey(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const id = ++fetchIdRef.current;
    // guardianId narrows both queries to a single family — parent home
    // consumer. Without it (admin consumers) we fetch the full
    // org+season slice. The view is org+season scoped itself.
    let accountsQuery = supabase
      .from('financial_accounts')
      .select('*, guardians(first_name, last_name, user_id)')
      .eq('org_id', orgId)
      .eq('season_id', seasonId);
    let balancesQuery = supabase
      .from('family_balances')
      .select('account_id, billed_cents, net_paid_cents, total_fees_cents, balance_cents')
      .eq('org_id', orgId)
      .eq('season_id', seasonId);
    if (guardianId) {
      accountsQuery = accountsQuery.eq('guardian_id', guardianId);
      balancesQuery = balancesQuery.eq('guardian_id', guardianId);
    }
    const [aRes, bRes] = await Promise.all([accountsQuery, balancesQuery]);
    if (id !== fetchIdRef.current) return;
    if (aRes.error || bRes.error) {
      const msg = aRes.error?.message || bRes.error?.message;
      console.error('useSeasonFinancials fetch:', msg);
      setError(msg);
      setAccounts([]);
      setBalanceRows([]);
      setFetchedKey(null);
      setLoading(false);
      return;
    }
    setError(null);
    setAccounts(aRes.data || []);
    setBalanceRows(bRes.data || []);
    setFetchedKey(keyFor(orgId, seasonId, guardianId));
    setLoading(false);
  }, [orgId, seasonId, guardianId]);

  useEffect(() => { Promise.resolve().then(refetch); }, [refetch]);

  // Single computation of per-account balance + aggregate stats, all
  // sourced from the family_balances view (one read path). Memoized off
  // balanceRows so consumers don't recompute every render. When isStale,
  // short-circuit to EMPTY_STATS so consumers don't see prior-key data.
  const { balances, stats } = useMemo(() => {
    if (isStale) return { balances: {}, stats: EMPTY_STATS };
    let billed = 0; let paid = 0; let fees = 0; let outstanding = 0; let familiesOwing = 0;
    const bal = {};
    balanceRows.forEach((r) => {
      const b = Number(r.balance_cents) || 0;
      bal[r.account_id] = b;
      billed += Number(r.billed_cents) || 0;
      paid += Number(r.net_paid_cents) || 0;
      fees += Number(r.total_fees_cents) || 0;
      outstanding += b;
      if (b > 0) familiesOwing += 1;
    });
    return {
      balances: bal,
      stats: {
        billed, paid, fees,
        net: paid - fees,
        outstanding,
        familiesOwing,
        pct: billed > 0 ? Math.round((paid / billed) * 100) : 0,
      },
    };
  }, [balanceRows, isStale]);

  return {
    accounts: isStale ? [] : accounts,
    balances,
    stats,
    loading: loading || isStale,
    error,
    refetch,
  };
}

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// Cat#30 HOME-2 / §4.AW: the admin-home "families owing" lane must measure
// the SAME concept at the SAME scope as the payment_overdue alert —
// all-seasons outstanding balance via the canonical family_balances view.
// Previously the lane read useSeasonFinancials.familiesOwing (active season
// only), so it showed 0 while the alert showed 1 for a prior-season debtor.
// Sums balance per guardian across all seasons; counts net-owing guardians.
export function useFamiliesOwingCount(orgId) {
  const [count, setCount] = useState(0);
  const [totalCents, setTotalCents] = useState(0);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!orgId) { setCount(0); setTotalCents(0); setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('family_balances')
      .select('guardian_id, balance_cents')
      .eq('org_id', orgId);
    if (error) {
      console.error('useFamiliesOwingCount:', error.message);
      setCount(0); setTotalCents(0); setLoading(false); return;
    }
    const byGuardian = {};
    for (const r of data || []) {
      byGuardian[r.guardian_id] = (byGuardian[r.guardian_id] || 0) + (Number(r.balance_cents) || 0);
    }
    const owing = Object.values(byGuardian).filter((b) => b > 0);
    setCount(owing.length);
    setTotalCents(owing.reduce((s, b) => s + b, 0));
    setLoading(false);
  }, [orgId]);

  // Deferred via microtask so the effect body doesn't call setState
  // synchronously (react-hooks/set-state-in-effect) — same pattern as
  // useProgramHealthMetrics.
  useEffect(() => { Promise.resolve().then(refetch); }, [refetch]);

  return { count, totalCents, loading };
}

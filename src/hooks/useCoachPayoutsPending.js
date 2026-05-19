import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// §4.C Sprint D — Admin PENDING QUEUES lane: pending coach payouts
// per HOME_DESIGN_SPEC §3.1.4. Surfaces coach_payouts rows with
// status='pending' (paid_at null) — admin needs to approve/mark
// paid.
//
// Click-through target: /admin/financial (CoachPayoutsSection lives
// inside the financial dashboard today).
//
// Per anti-pattern #36 (data + error destructured) + #37 (org_id
// filter first on the chain).

export function useCoachPayoutsPending(orgId) {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    if (!orgId) {
      setCount(0);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { count: c, error: e } = await supabase
      .from('coach_payouts')
      .select('id', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .eq('status', 'pending');
    if (e) {
      console.error('useCoachPayoutsPending fetch:', e.message);
      setError(e.message);
      setCount(0);
      setLoading(false);
      return;
    }
    setError(null);
    setCount(c || 0);
    setLoading(false);
  }, [orgId]);

  useEffect(() => { Promise.resolve().then(refetch); }, [refetch]);

  return { count, loading, error, refetch };
}

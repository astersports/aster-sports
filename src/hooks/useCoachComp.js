import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// useCoachComp — the coach's OWN pay summary from coach_payouts (the canonical
// ledger): owed = sum(pending), paid = sum(paid), pendingSessions from the
// source_assignments lengths. A coach with no rate/payouts (Kenny, Frank) gets
// zeros + hasComp=false → the card hides. Org-scoped first (AP#37); error
// surfaced, not swallowed (AP#36).
export function useCoachComp(userId, orgId) {
  const [comp, setComp] = useState({ owedCents: 0, paidCents: 0, pendingSessions: 0, hasComp: false });
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!userId || !orgId) { setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('coach_payouts')
      .select('amount_cents, status, source_assignments')
      .eq('org_id', orgId)
      .eq('coach_user_id', userId);
    if (error) { console.error('useCoachComp:', error.message); setLoading(false); return; }
    let owed = 0; let paid = 0; let sessions = 0;
    for (const r of data || []) {
      if (r.status === 'pending') { owed += r.amount_cents || 0; sessions += r.source_assignments?.length || 0; }
      else if (r.status === 'paid') { paid += r.amount_cents || 0; }
    }
    setComp({ owedCents: owed, paidCents: paid, pendingSessions: sessions, hasComp: (data || []).length > 0 });
    setLoading(false);
  }, [userId, orgId]);

  useEffect(() => { Promise.resolve().then(refetch); }, [refetch]);
  return { ...comp, loading, refetch };
}

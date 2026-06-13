import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

// Per-coach payout grouping for Financials → Coaches. Fixes the prior broken
// SELECT (it referenced period_start/period_end, which don't exist, so the
// query errored on every load and the section rendered empty) and resolves
// coach names via staff_profiles. Season-scoped to match the Families view.
// Fetch shape mirrors useSeasonFinancials (useCallback + microtask-deferred
// effect) so setState never runs synchronously in the effect body.
export function useCoachPayouts(orgId, seasonId) {
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const fetchIdRef = useRef(0);

  const load = useCallback(async () => {
    if (!orgId || !seasonId) { setCoaches([]); setLoading(false); return; }
    setLoading(true);
    const id = ++fetchIdRef.current;
    const [payRes, staffRes] = await Promise.all([
      supabase.from('coach_payouts')
        .select('id, coach_user_id, amount_cents, status, payment_method, paid_at, created_at')
        .eq('org_id', orgId).eq('season_id', seasonId)
        .order('created_at', { ascending: false }),
      supabase.from('staff_profiles').select('user_id, display_name').eq('org_id', orgId),
    ]);
    if (id !== fetchIdRef.current) return;
    if (payRes.error) console.error('useCoachPayouts payouts:', payRes.error.message);
    if (staffRes.error) console.error('useCoachPayouts staff:', staffRes.error.message);
    const names = {};
    (staffRes.data || []).forEach((s) => { names[s.user_id] = s.display_name; });
    const byCoach = {};
    (payRes.data || []).forEach((p) => {
      const g = (byCoach[p.coach_user_id] ||= { userId: p.coach_user_id, name: names[p.coach_user_id] || 'Coach', rows: [], paidCents: 0, pendingCents: 0 });
      g.rows.push(p);
      if (p.status === 'paid') g.paidCents += p.amount_cents;
      else if (p.status === 'pending') g.pendingCents += p.amount_cents;
    });
    setCoaches(Object.values(byCoach).sort((a, b) => (b.paidCents + b.pendingCents) - (a.paidCents + a.pendingCents)));
    setLoading(false);
  }, [orgId, seasonId]);

  useEffect(() => { Promise.resolve().then(load); }, [load]);

  return { coaches, loading };
}

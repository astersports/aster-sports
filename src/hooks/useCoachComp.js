import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { countOwedSessions, sumOwedCents, sumPaidCents } from '../lib/coachComp';

// useCoachComp — the coach's OWN reconciled pay summary (PR-1 canonical, DR-F1).
// Same numbers the admin sees: owed = Σ owed sessions, paid = Σ paid payouts,
// never netted. Org-scoped (sessions via event→team→org; payouts via org_id) —
// not season-scoped, so "paid" is the coach's lifetime paid, not one season.
// A coach with no owed + no paid gets hasComp=false → the card hides (directors).
// Errors surfaced, not swallowed (AP#36).
export function useCoachComp(userId, orgId) {
  const [comp, setComp] = useState({ owedCents: 0, paidCents: 0, owedSessions: 0, hasComp: false });
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!userId || !orgId) { setLoading(false); return; }
    setLoading(true);
    const teamsRes = await supabase.from('teams').select('id').eq('org_id', orgId);
    if (teamsRes.error) { console.error('useCoachComp teams:', teamsRes.error.message); setLoading(false); return; }
    const teamIds = (teamsRes.data || []).map((t) => t.id);
    const [sessRes, payRes] = await Promise.all([
      teamIds.length
        ? supabase.from('event_coach_assignments').select('pay_cents, pay_status, events!inner(team_id)')
            .eq('coach_user_id', userId).in('events.team_id', teamIds)
        : Promise.resolve({ data: [] }),
      supabase.from('coach_payouts').select('amount_cents, status').eq('org_id', orgId).eq('coach_user_id', userId),
    ]);
    if (sessRes.error || payRes.error) {
      console.error('useCoachComp:', (sessRes.error || payRes.error).message); setLoading(false); return;
    }
    const sessions = sessRes.data || [];
    const owedCents = sumOwedCents(sessions);
    const paidCents = sumPaidCents(payRes.data);
    setComp({ owedCents, paidCents, owedSessions: countOwedSessions(sessions), hasComp: owedCents > 0 || paidCents > 0 });
    setLoading(false);
  }, [userId, orgId]);

  useEffect(() => { Promise.resolve().then(refetch); }, [refetch]);
  return { ...comp, loading, refetch };
}

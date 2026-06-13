import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { sumOwedCents, sumPaidCents } from '../lib/coachComp';

// Coach comp for Financials → Coaches. PR-1 canonical (DR-F1), per coach,
// ORG-scoped (coach pay is not season-bound — sessions span the active season's
// teams, payouts are lifetime):
//   owed = Σ event_coach_assignments.pay_cents WHERE pay_status='owed'
//   paid = Σ coach_payouts.amount_cents       WHERE status='paid'
// Never netted — no balance = owed − paid (the old −$680 artifact). Rate shown
// for context only (from coaching_assignments), not used in owed math. Names via
// staff_profiles. Coaches with owed sessions, payouts, or an active rate surface.
export function useCoachPayouts(orgId) {
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const fetchIdRef = useRef(0);

  const load = useCallback(async () => {
    if (!orgId) { setCoaches([]); setLoading(false); return; }
    setLoading(true);
    const id = ++fetchIdRef.current;
    const teamsRes = await supabase.from('teams').select('id').eq('org_id', orgId);
    if (id !== fetchIdRef.current) return;
    if (teamsRes.error) { console.error('useCoachPayouts teams:', teamsRes.error.message); setLoading(false); return; }
    const teamIds = (teamsRes.data || []).map((t) => t.id);

    const [payRes, staffRes, caRes, ecaRes] = await Promise.all([
      supabase.from('coach_payouts').select('id, coach_user_id, amount_cents, status, payment_method, paid_at, created_at').eq('org_id', orgId).order('created_at', { ascending: false }),
      supabase.from('staff_profiles').select('user_id, display_name, default_payout_method').eq('org_id', orgId),
      supabase.from('coaching_assignments').select('user_id, pay_per_session_cents').eq('org_id', orgId).eq('active', true),
      teamIds.length ? supabase.from('event_coach_assignments').select('coach_user_id, pay_cents, pay_status, events!inner(team_id)').in('events.team_id', teamIds) : Promise.resolve({ data: [] }),
    ]);
    if (id !== fetchIdRef.current) return;
    [payRes, staffRes, caRes, ecaRes].forEach((r, i) => { if (r?.error) console.error(`useCoachPayouts q${i}:`, r.error.message); });

    const names = {}; const methods = {};
    (staffRes.data || []).forEach((s) => { names[s.user_id] = s.display_name; methods[s.user_id] = s.default_payout_method || null; });

    const sessionsByCoach = {};
    (ecaRes.data || []).forEach((r) => { if (r.events) (sessionsByCoach[r.coach_user_id] ||= []).push(r); });

    const rateByCoach = {};
    (caRes.data || []).forEach((a) => {
      if (a.pay_per_session_cents && a.pay_per_session_cents > (rateByCoach[a.user_id] || 0)) rateByCoach[a.user_id] = a.pay_per_session_cents;
    });

    const byCoach = {};
    const ensure = (uid) => (byCoach[uid] ||= { userId: uid, name: names[uid] || 'Coach', defaultMethod: methods[uid] || null, rows: [], pendingCents: 0 });
    (payRes.data || []).forEach((p) => {
      const g = ensure(p.coach_user_id);
      g.rows.push(p);
      if (p.status === 'pending') g.pendingCents += p.amount_cents;
    });
    Object.keys(sessionsByCoach).forEach(ensure);
    Object.keys(rateByCoach).forEach(ensure);

    const list = Object.values(byCoach).map((c) => ({
      ...c,
      owedCents: sumOwedCents(sessionsByCoach[c.userId]),
      paidCents: sumPaidCents(c.rows),
      rateCents: rateByCoach[c.userId] || 0,
    })).sort((a, b) => b.owedCents - a.owedCents);

    setCoaches(list);
    setLoading(false);
  }, [orgId]);

  useEffect(() => { Promise.resolve().then(load); }, [load]);
  return { coaches, loading, refetch: load };
}

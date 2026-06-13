import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { sumOwedCents, sumPaidCents } from '../lib/coachComp';

// One coach's financial detail for /admin/financials/coach/:userId — the
// per-session ledger behind "owed" (event_coach_assignments) + the recorded
// payouts + name/rate/method. PR-1 canonical (DR-F1): owed = Σ pay_cents over
// OWED sessions; paid = Σ paid payouts. Org-scoped (all org teams), never
// netted — no balance = owed − paid (the old −$680 artifact).
export function useCoachDetail(orgId, seasonId, userId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const fetchIdRef = useRef(0);

  const load = useCallback(async () => {
    if (!orgId || !seasonId || !userId) { setLoading(false); return; }
    setLoading(true);
    const id = ++fetchIdRef.current;
    const teamsRes = await supabase.from('teams').select('id, name').eq('org_id', orgId);
    if (id !== fetchIdRef.current) return;
    if (teamsRes.error) { console.error('useCoachDetail teams:', teamsRes.error.message); setLoading(false); return; }
    const teamName = {}; (teamsRes.data || []).forEach((t) => { teamName[t.id] = t.name; });
    const teamIds = (teamsRes.data || []).map((t) => t.id);

    const [profRes, rateRes, payRes, sessRes] = await Promise.all([
      supabase.from('staff_profiles').select('display_name, default_payout_method').eq('org_id', orgId).eq('user_id', userId).maybeSingle(),
      supabase.from('coaching_assignments').select('pay_per_session_cents').eq('org_id', orgId).eq('user_id', userId).eq('active', true).order('pay_per_session_cents', { ascending: false, nullsFirst: false }).limit(1).maybeSingle(),
      supabase.from('coach_payouts').select('id, amount_cents, status, payment_method, paid_at, created_at').eq('org_id', orgId).eq('coach_user_id', userId).order('created_at', { ascending: false }),
      teamIds.length ? supabase.from('event_coach_assignments').select('id, pay_cents, pay_status, settled_by_payout_id, events!inner(id, title, start_at, event_type, team_id)').eq('coach_user_id', userId).in('events.team_id', teamIds) : Promise.resolve({ data: [] }),
    ]);
    if (id !== fetchIdRef.current) return;
    [profRes, rateRes, payRes, sessRes].forEach((r, i) => { if (r?.error) console.error(`useCoachDetail q${i}:`, r.error.message); });

    const sessions = (sessRes.data || []).map((s) => ({
      id: s.id, pay_cents: s.pay_cents || 0, pay_status: s.pay_status, settled_by_payout_id: s.settled_by_payout_id,
      title: s.events?.title || '—', startAt: s.events?.start_at, teamName: teamName[s.events?.team_id] || '',
    })).sort((a, b) => new Date(b.startAt) - new Date(a.startAt));
    const payouts = payRes.data || [];
    const owedCents = sumOwedCents(sessions);
    const paidCents = sumPaidCents(payouts);
    const pendingCents = payouts.filter((p) => p.status === 'pending').reduce((sum, p) => sum + p.amount_cents, 0);

    setData({
      userId, name: profRes.data?.display_name || 'Coach', defaultMethod: profRes.data?.default_payout_method || null,
      rateCents: rateRes.data?.pay_per_session_cents || 0,
      sessions, payouts, owedCents, paidCents, pendingCents,
    });
    setLoading(false);
  }, [orgId, seasonId, userId]);

  useEffect(() => { Promise.resolve().then(load); }, [load]);
  return { data, loading, refetch: load };
}

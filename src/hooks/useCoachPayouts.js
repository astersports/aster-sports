import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

// Coach comp for Financials → Coaches. Per coach (season-scoped):
//   - OWED  = Σ over the coach's active coaching_assignments with a rate of
//             pay_per_session_cents × sessions coached on that team
//             (event_coach_assignments), honoring scope (games_only counts
//             only game/tournament events; all_events counts everything).
//   - PAID / PENDING = sum of recorded coach_payouts by status.
//   - BALANCE = owed − paid.
// Names resolve via staff_profiles. Coaches with a rate but no payouts still
// surface (so you can see what's owed before paying). Fixes the prior broken
// SELECT (period_start/end don't exist) — see the 2026-06-13 Financials work.
export function useCoachPayouts(orgId, seasonId) {
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const fetchIdRef = useRef(0);

  const load = useCallback(async () => {
    if (!orgId || !seasonId) { setCoaches([]); setLoading(false); return; }
    setLoading(true);
    const id = ++fetchIdRef.current;
    const teamsRes = await supabase.from('teams').select('id').eq('org_id', orgId).eq('season_id', seasonId);
    if (id !== fetchIdRef.current) return;
    if (teamsRes.error) { console.error('useCoachPayouts teams:', teamsRes.error.message); setLoading(false); return; }
    const teamIds = (teamsRes.data || []).map((t) => t.id);

    const [payRes, staffRes, caRes, ecaRes] = await Promise.all([
      supabase.from('coach_payouts').select('id, coach_user_id, amount_cents, status, payment_method, paid_at, created_at').eq('org_id', orgId).eq('season_id', seasonId).order('created_at', { ascending: false }),
      supabase.from('staff_profiles').select('user_id, display_name').eq('org_id', orgId),
      supabase.from('coaching_assignments').select('user_id, team_id, pay_per_session_cents, scope').eq('org_id', orgId).eq('active', true),
      teamIds.length ? supabase.from('event_coach_assignments').select('coach_user_id, events!inner(team_id, event_type)').in('events.team_id', teamIds) : Promise.resolve({ data: [] }),
    ]);
    if (id !== fetchIdRef.current) return;
    [payRes, staffRes, caRes, ecaRes].forEach((r, i) => { if (r?.error) console.error(`useCoachPayouts q${i}:`, r.error.message); });

    const names = {};
    (staffRes.data || []).forEach((s) => { names[s.user_id] = s.display_name; });

    const sessions = {}; // sessions[coach][team] = { all, games }
    (ecaRes.data || []).forEach((r) => {
      const ev = r.events; if (!ev) return;
      const t = ((sessions[r.coach_user_id] ||= {})[ev.team_id] ||= { all: 0, games: 0 });
      t.all += 1;
      if (ev.event_type === 'game' || ev.event_type === 'tournament') t.games += 1;
    });

    const owedByCoach = {}; const rateByCoach = {};
    (caRes.data || []).filter((a) => teamIds.includes(a.team_id) && a.pay_per_session_cents).forEach((a) => {
      const sess = sessions[a.user_id]?.[a.team_id] || { all: 0, games: 0 };
      const n = a.scope === 'games_only' ? sess.games : sess.all;
      owedByCoach[a.user_id] = (owedByCoach[a.user_id] || 0) + a.pay_per_session_cents * n;
      rateByCoach[a.user_id] = a.pay_per_session_cents;
    });

    const byCoach = {};
    (payRes.data || []).forEach((p) => {
      const g = (byCoach[p.coach_user_id] ||= { userId: p.coach_user_id, name: names[p.coach_user_id] || 'Coach', rows: [], paidCents: 0, pendingCents: 0 });
      g.rows.push(p);
      if (p.status === 'paid') g.paidCents += p.amount_cents;
      else if (p.status === 'pending') g.pendingCents += p.amount_cents;
    });
    Object.keys(owedByCoach).forEach((uid) => {
      if (!byCoach[uid]) byCoach[uid] = { userId: uid, name: names[uid] || 'Coach', rows: [], paidCents: 0, pendingCents: 0 };
    });

    const list = Object.values(byCoach).map((c) => ({
      ...c,
      owedCents: owedByCoach[c.userId] || 0,
      rateCents: rateByCoach[c.userId] || 0,
      balanceCents: (owedByCoach[c.userId] || 0) - c.paidCents,
    })).sort((a, b) => b.balanceCents - a.balanceCents);

    setCoaches(list);
    setLoading(false);
  }, [orgId, seasonId]);

  useEffect(() => { Promise.resolve().then(load); }, [load]);
  return { coaches, loading, refetch: load };
}

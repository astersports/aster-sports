import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

// H-1 — the admin Home "Registration" rollup. Reads the OPEN registration programs
// (window live now) + their live count + program-scoped money — all from existing
// tables/views, no schema change. Money is the ONE shared source (family_balances,
// post funnel-billing fix): collected = SUM(net_paid_cents), due = SUM(max(balance,0)),
// scoped season_id IN open ids (season_id is the program FK). fee_set = the program
// has a division with a base fee (the D1 implicit unit counts). #36: errors surfaced.
export function useOpenRegistration() {
  const { orgId } = useAuth();
  const [data, setData] = useState({ loading: true, openCount: 0 });

  const refetch = useCallback(async () => {
    if (!orgId) { setData({ loading: false, openCount: 0 }); return; }
    const nowIso = new Date().toISOString();
    const { data: open, error } = await supabase
      .from('programs')
      .select('id, name, program_type, reg_closes_at')
      .eq('org_id', orgId).eq('is_published', true)
      .lte('reg_opens_at', nowIso).gte('reg_closes_at', nowIso)
      .order('reg_closes_at', { ascending: true });
    if (error) { console.error('useOpenRegistration:', error.message); setData({ loading: false, openCount: 0 }); return; }
    const openList = open || [];
    const ids = openList.map((p) => p.id);
    if (!ids.length) { setData({ loading: false, openCount: 0 }); return; }

    const [regRes, divRes, balRes] = await Promise.all([
      supabase.from('registrations').select('id', { count: 'exact', head: true }).in('program_id', ids).neq('status', 'cancelled'),
      supabase.from('divisions').select('id, program_id').in('program_id', ids),
      supabase.from('family_balances').select('net_paid_cents, balance_cents').eq('org_id', orgId).in('season_id', ids),
    ]);
    if (regRes.error || divRes.error || balRes.error) {
      console.error('useOpenRegistration agg:', regRes.error?.message || divRes.error?.message || balRes.error?.message);
      setData({ loading: false, openCount: 0 }); return;
    }
    const divisions = divRes.data || [];
    let feeDivIds = new Set();
    if (divisions.length) {
      const { data: fees, error: feeErr } = await supabase
        .from('division_fees').select('division_id').in('division_id', divisions.map((d) => d.id)).eq('fee_type', 'base');
      if (feeErr) console.error('useOpenRegistration fees:', feeErr.message);
      feeDivIds = new Set((fees || []).map((f) => f.division_id));
    }
    const feeSetPrograms = new Set(divisions.filter((d) => feeDivIds.has(d.id)).map((d) => d.program_id));
    const balRows = balRes.data || [];

    setData({
      loading: false,
      openCount: openList.length,
      registered: regRes.count || 0,
      collectedCents: balRows.reduce((s, r) => s + (r.net_paid_cents || 0), 0),
      dueCents: balRows.reduce((s, r) => s + Math.max(r.balance_cents || 0, 0), 0),
      needsFeeCount: openList.filter((p) => !feeSetPrograms.has(p.id)).length,
      soonestCloseAt: openList[0]?.reg_closes_at || null, // ordered asc
      singleProgram: openList.length === 1 ? { ...openList[0], feeSet: feeSetPrograms.has(openList[0].id) } : null,
    });
  }, [orgId]);

  useEffect(() => { Promise.resolve().then(refetch); }, [refetch]);

  return { ...data, refetch };
}

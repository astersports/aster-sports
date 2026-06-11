import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// F-5: revenue collected through the open registration funnel, scoped to the open
// program by name ($0 until a registration lands). Finds a published, active,
// reg-window-open tryout/camp program and sums its collected (net_paid) from the
// family_balances view. Returns { name, collectedCents } or null when none is open.
// Separate from the season-scoped dashboard stats — the funnel program has its own
// season_id and (until registrations land) no financial_accounts.
export function useFunnelRevenue(orgId) {
  const [state, setState] = useState(null);
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!orgId) { if (alive) setState(null); return; }
      const now = Date.now();
      const { data: progs, error: pErr } = await supabase
        .from('programs')
        .select('id, name, reg_opens_at, reg_closes_at')
        .eq('org_id', orgId).eq('is_published', true).eq('status', 'active')
        .in('program_type', ['tryout', 'camp'])
        .order('reg_opens_at', { ascending: false }); // deterministic pick if >1 open
      if (pErr) { console.error('useFunnelRevenue programs:', pErr.message); if (alive) setState(null); return; }
      const open = (progs || []).find((p) => {
        const o = p.reg_opens_at ? new Date(p.reg_opens_at).getTime() : null;
        const c = p.reg_closes_at ? new Date(p.reg_closes_at).getTime() : null;
        return (!o || now >= o) && (!c || now < c);
      });
      if (!open) { if (alive) setState(null); return; }
      const { data: bal, error: bErr } = await supabase
        .from('family_balances').select('net_paid_cents').eq('org_id', orgId).eq('season_id', open.id);
      if (bErr) { console.error('useFunnelRevenue balances:', bErr.message); if (alive) setState(null); return; }
      const collectedCents = (bal || []).reduce((s, r) => s + (Number(r.net_paid_cents) || 0), 0);
      if (alive) setState({ name: open.name, collectedCents });
    })();
    return () => { alive = false; };
  }, [orgId]);
  return state;
}

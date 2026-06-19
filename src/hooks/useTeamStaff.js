import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// Teams PR-2 Part B — a team's coaches (team_staff) joined to staff_profiles
// (names; no FK, joined in JS per teamStaffEmbedAudit) and their ACTIVE comp
// (coaching_assignments). RLS returns every comp row to an admin but only the
// viewer's OWN to a coach — so a peer's rate never reaches a coach's client
// (the UI also gates display, defense in depth). AP #36: error-checked.
export function useTeamStaff(teamId) {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!teamId) { setLoading(false); return; }
    setLoading(true);
    try {
      const { data: ts, error: tsErr } = await supabase
        .from('team_staff').select('user_id, role').eq('team_id', teamId);
      if (tsErr) throw tsErr;
      const userIds = [...new Set((ts || []).map((r) => r.user_id).filter(Boolean))];
      let profByUser = new Map();
      let compByUser = new Map();
      if (userIds.length) {
        const { data: prof, error: pErr } = await supabase
          .from('staff_profiles').select('user_id, display_name, title').in('user_id', userIds);
        if (pErr) throw pErr;
        profByUser = new Map((prof || []).map((p) => [p.user_id, p]));
        const { data: ca, error: cErr } = await supabase
          .from('coaching_assignments')
          .select('user_id, role, scope, pay_per_session_cents')
          .eq('team_id', teamId).eq('active', true);
        if (cErr) throw cErr;
        compByUser = new Map((ca || []).map((c) => [c.user_id, c]));
      }
      setStaff((ts || []).filter((r) => r.user_id).map((r) => {
        const c = compByUser.get(r.user_id);
        return {
          userId: r.user_id,
          name: profByUser.get(r.user_id)?.display_name || 'Coach',
          title: profByUser.get(r.user_id)?.title || null,
          role: r.role,
          comp: c ? { rateCents: c.pay_per_session_cents, scope: c.scope, role: c.role } : null,
        };
      }).sort((a, b) => a.name.localeCompare(b.name)));
    } catch (err) {
      console.error('useTeamStaff:', err.message);
      setStaff([]);
    }
    setLoading(false);
  }, [teamId]);

  useEffect(() => { (async () => { await refetch(); })(); }, [refetch]);

  return { staff, loading, refetch };
}

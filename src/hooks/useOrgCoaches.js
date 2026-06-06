// Cutover Wave PR 6 (PR C) — all coaches in the current org, for the
// coverage-delegation "reassign to" dropdown (Q3 = any org coach).
// Distinct team_staff users across the org's teams, joined to
// staff_profiles for display names. AP #36 (destructure error + throw),
// AP #37 (team_staff is team-scoped; filter via teams.org_id).

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export function useOrgCoaches() {
  const { orgId } = useAuth();
  const [coaches, setCoaches] = useState([]);

  useEffect(() => {
    if (!orgId) { Promise.resolve().then(() => setCoaches([])); return undefined; }
    let cancelled = false;
    (async () => {
      // teams!inner is a valid FK embed (org filter). staff_profiles has NO
      // FK from team_staff — embedding it throws "Could not find a
      // relationship", so it's fetched separately and joined by user_id.
      const { data, error } = await supabase
        .from('team_staff')
        .select('user_id, role, teams!inner ( org_id )')
        .eq('teams.org_id', orgId)
        .in('role', ['head_coach', 'assistant_coach']);
      if (cancelled) return;
      if (error) { console.error('useOrgCoaches:', error.message); setCoaches([]); return; }
      const userIds = [...new Set((data || []).map((r) => r.user_id).filter(Boolean))];
      let profByUser = new Map();
      if (userIds.length) {
        const { data: profData, error: pErr } = await supabase
          .from('staff_profiles')
          .select('user_id, display_name')
          .in('user_id', userIds);
        if (cancelled) return;
        if (pErr) { console.error('useOrgCoaches:', pErr.message); setCoaches([]); return; }
        profByUser = new Map((profData || []).map((p) => [p.user_id, p]));
      }
      const byUser = new Map();
      for (const r of data || []) {
        if (r.user_id && !byUser.has(r.user_id)) {
          byUser.set(r.user_id, { user_id: r.user_id, name: profByUser.get(r.user_id)?.display_name || 'Coach' });
        }
      }
      setCoaches([...byUser.values()].sort((a, b) => a.name.localeCompare(b.name)));
    })();
    return () => { cancelled = true; };
  }, [orgId]);

  return coaches;
}

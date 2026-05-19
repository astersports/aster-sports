import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// §4.C Sprint D — Admin PENDING QUEUES lane: org-wide pending
// achievements per HOME_DESIGN_SPEC §3.1.4. Surfaces team_achievements
// rows with is_pending_confirmation=true across all teams in the org.
//
// Coach variant (usePendingAchievements) scopes to team_staff teams;
// admin variant scopes to org. Same table, different filter.
//
// Per anti-pattern #36 (data + error destructured) + #37 (org_id
// filter via FK chain through teams!inner).

export function usePendingAchievementsOrg(orgId) {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    if (!orgId) {
      setCount(0);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { count: c, error: e } = await supabase
      .from('team_achievements')
      .select('id, teams!inner(org_id)', { count: 'exact', head: true })
      .eq('teams.org_id', orgId)
      .eq('is_pending_confirmation', true)
      .is('archived_at', null);
    if (e) {
      console.error('usePendingAchievementsOrg fetch:', e.message);
      setError(e.message);
      setCount(0);
      setLoading(false);
      return;
    }
    setError(null);
    setCount(c || 0);
    setLoading(false);
  }, [orgId]);

  useEffect(() => { Promise.resolve().then(refetch); }, [refetch]);

  return { count, loading, error, refetch };
}

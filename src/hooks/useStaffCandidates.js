import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// Teams PR-2 Part B — org staff (staff_profiles) eligible to assign to a team,
// minus those already on it. Lazy: fetches when enabled (assign sheet open).
// existingUserIds should be memoized by the caller (stable identity).
export function useStaffCandidates(orgId, existingUserIds, enabled) {
  const [candidates, setCandidates] = useState([]);

  const refetch = useCallback(async () => {
    if (!enabled || !orgId) return;
    const { data, error } = await supabase
      .from('staff_profiles').select('user_id, display_name, title').eq('org_id', orgId);
    if (error) { console.error('useStaffCandidates:', error.message); setCandidates([]); return; }
    const excl = new Set(existingUserIds || []);
    setCandidates((data || [])
      .filter((s) => !excl.has(s.user_id))
      .map((s) => ({ userId: s.user_id, name: s.display_name || 'Coach', title: s.title }))
      .sort((a, b) => a.name.localeCompare(b.name)));
  }, [orgId, enabled, existingUserIds]);

  useEffect(() => { (async () => { await refetch(); })(); }, [refetch]);

  return { candidates, refetch };
}

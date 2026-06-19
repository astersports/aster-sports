import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// Teams PR-2 Part A — org players NOT currently active on this team; the
// Add-player picker source. RLS scopes `players` to the org (admin sees all;
// a coach sees only their RLS-visible players — admin is the effective
// manager for now). A kid already on OTHER teams is still a candidate here;
// only players active on THIS team are excluded. Lazy: fetches when enabled
// (the picker is modal — no fetch until it opens). Destructures error and
// surfaces it before trusting data (AP #36).
export function useTeamCandidates(teamId, orgId, enabled) {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);

  const refetch = useCallback(async () => {
    if (!enabled || !teamId || !orgId) return;
    setLoading(true);
    try {
      const { data: tp, error: tpErr } = await supabase
        .from('team_players').select('player_id').eq('team_id', teamId).eq('status', 'active');
      if (tpErr) throw tpErr;
      const onTeam = new Set((tp || []).map((r) => r.player_id));
      const { data, error } = await supabase
        .from('players')
        .select('id, first_name, last_name, grade, dob, member_type')
        .eq('org_id', orgId).eq('is_active', true)
        .order('last_name').order('first_name');
      if (error) throw error;
      setCandidates((data || []).filter((p) => !onTeam.has(p.id)));
    } catch (err) {
      console.error('useTeamCandidates:', err.message);
      setCandidates([]);
    }
    setLoading(false);
  }, [teamId, orgId, enabled]);

  // async-IIFE wrap defers the setState out of the synchronous effect body
  // (react-hooks/set-state-in-effect) — same pattern as useRoster.
  useEffect(() => {
    (async () => { await refetch(); })();
  }, [refetch]);

  return { candidates, loading, refetch };
}

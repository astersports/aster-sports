import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

// useCoachRosterHealth — attendance signal for the coach's teams, from
// check_ins (the canonical attendance source; NOT inferred from anything
// else). check_ins is empty until coaches use Start Check-In, so today this
// returns hasData=false → the card shows the adoption nudge. When check-ins
// exist, checkInCount drives the summary. FK-scoped via events (no org_id on
// check_ins); AP#36 error-surfaced.
export function useCoachRosterHealth(coachedTeamIds, seasonId) {
  const [checkInCount, setCheckInCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const teamKey = useMemo(() => (coachedTeamIds || []).join(','), [coachedTeamIds]);

  const refetch = useCallback(async () => {
    const ids = teamKey ? teamKey.split(',') : [];
    if (!ids.length || !seasonId) { setCheckInCount(0); setLoading(false); return; }
    setLoading(true);
    const { count, error } = await supabase
      .from('check_ins')
      .select('id, events!inner(team_id, season_id)', { count: 'exact', head: true })
      .in('events.team_id', ids)
      .eq('events.season_id', seasonId);
    if (error) { console.error('useCoachRosterHealth:', error.message); setCheckInCount(0); setLoading(false); return; }
    setCheckInCount(count || 0);
    setLoading(false);
  }, [teamKey, seasonId]);

  useEffect(() => { Promise.resolve().then(refetch); }, [refetch]);
  return { checkInCount, hasData: checkInCount > 0, loading, refetch };
}

import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

// useActivePrograms — the active program-season SET for the current user (the
// multi-program foundation, Phase 1). `programs` is the unified entity
// (`seasons` is a view over it: programs WHERE program_type='season'), so this
// reads status='active' ACROSS program_type. Role-scoped:
//   admin        → all active programs for the org
//   coach/parent → the active programs whose teams the user touches (myTeamIds)
// NO-REGRESSION INVARIANT: Legacy has ONE active program today (a 'season'), so
// the set has one entry and every consumer resolves identically to the prior
// singular useSeason().activeSeason. AP#36: error surfaced, not swallowed.
export function useActivePrograms() {
  const { orgId, role, myTeamIds } = useAuth();
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!orgId) { setLoading(false); return; }
    setLoading(true);
    const { data: progs, error } = await supabase
      .from('programs')
      .select('id, name, program_type, status, start_date, end_date')
      .eq('org_id', orgId)
      .eq('status', 'active');
    if (error) { console.error('useActivePrograms:', error.message); setPrograms([]); setLoading(false); return; }
    const ids = (progs || []).map((p) => p.id);
    let teams = [];
    if (ids.length) {
      const { data: t, error: tErr } = await supabase
        .from('teams').select('id, season_id').eq('org_id', orgId).in('season_id', ids);
      if (tErr) { console.error('useActivePrograms teams:', tErr.message); }
      teams = t || [];
    }
    const scoped = role === 'admin' ? null : new Set(myTeamIds || []);
    const byProgram = new Map(ids.map((id) => [id, []]));
    for (const tm of teams) {
      if (scoped && !scoped.has(tm.id)) continue;
      byProgram.get(tm.season_id)?.push(tm.id);
    }
    const set = (progs || [])
      .map((p) => ({
        id: p.id, programType: p.program_type, name: p.name, status: p.status,
        startDate: p.start_date, endDate: p.end_date, teamIds: byProgram.get(p.id) || [],
      }))
      // coach/parent only see programs they actually touch (>=1 scoped team)
      .filter((p) => role === 'admin' || p.teamIds.length > 0);
    setPrograms(set);
    setLoading(false);
  }, [orgId, role, myTeamIds]);

  useEffect(() => { Promise.resolve().then(refetch); }, [refetch]);

  const teamIds = useMemo(() => [...new Set(programs.flatMap((p) => p.teamIds))], [programs]);
  return { programs, teamIds, loading, refetch };
}

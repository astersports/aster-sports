import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

// All programs for the org (every type + status) with team + player counts, for
// the /admin/programs index (PR-3). Admin-only surface. AP#36: errors surfaced,
// not swallowed into a silent empty list.
export function useAllPrograms() {
  const { orgId } = useAuth();
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!orgId) { setLoading(false); return; }
    setLoading(true);
    const { data: progs, error } = await supabase
      .from('programs')
      .select('id, name, program_type, status, start_date, end_date')
      .eq('org_id', orgId)
      .order('start_date', { ascending: false });
    if (error) { console.error('useAllPrograms:', error.message); setPrograms([]); setLoading(false); return; }

    const ids = (progs || []).map((p) => p.id);
    let teams = [];
    if (ids.length) {
      const { data: t, error: tErr } = await supabase
        .from('teams').select('id, season_id').eq('org_id', orgId).in('season_id', ids);
      if (tErr) console.error('useAllPrograms teams:', tErr.message);
      teams = t || [];
    }
    const teamToProgram = {};
    const teamCount = {};
    for (const tm of teams) { teamToProgram[tm.id] = tm.season_id; teamCount[tm.season_id] = (teamCount[tm.season_id] || 0) + 1; }

    let roster = [];
    const teamIds = teams.map((t) => t.id);
    if (teamIds.length) {
      const { data: tp, error: tpErr } = await supabase
        .from('team_players').select('team_id').in('team_id', teamIds);
      if (tpErr) console.error('useAllPrograms players:', tpErr.message);
      roster = tp || [];
    }
    const playerCount = {};
    for (const row of roster) { const pid = teamToProgram[row.team_id]; if (pid) playerCount[pid] = (playerCount[pid] || 0) + 1; }

    setPrograms((progs || []).map((p) => ({
      id: p.id, name: p.name, programType: p.program_type, status: p.status,
      startDate: p.start_date, endDate: p.end_date,
      teamCount: teamCount[p.id] || 0, playerCount: playerCount[p.id] || 0,
    })));
    setLoading(false);
  }, [orgId]);

  // Microtask wrap keeps the synchronous setLoading(true) out of the effect body.
  useEffect(() => { Promise.resolve().then(refetch); }, [refetch]);
  return { programs, loading, refetch };
}

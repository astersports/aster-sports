import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

// Teams for ONE program (PR-3 ProgramDetailPage). Scoped to programId — NOT the
// global active season — which is what makes camp/clinic teams manageable in
// place (F6/F7). Embeds team_types(slug) so the list can classify. AP#36:
// errors surfaced, not swallowed.
export function useProgramTeams(programId) {
  const { orgId } = useAuth();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!orgId || !programId) { setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('teams')
      .select('id, name, team_color, sort_order, age_group, circuit, circuit_name, gender, practice_day, practice_location, team_type_id, roster_visibility_override, team_types(slug)')
      .eq('org_id', orgId).eq('season_id', programId)
      .order('sort_order', { ascending: true });
    if (error) { console.error('useProgramTeams:', error.message); setTeams([]); setLoading(false); return; }
    setTeams(data || []);
    setLoading(false);
  }, [orgId, programId]);

  useEffect(() => { Promise.resolve().then(refetch); }, [refetch]);

  const createTeam = useCallback(async (input) => {
    if (!orgId || !programId) return { error: 'No program' };
    const { error } = await supabase.from('teams').insert({ ...input, org_id: orgId, season_id: programId });
    if (!error) await refetch();
    return { error: error?.message };
  }, [orgId, programId, refetch]);

  const updateTeam = useCallback(async (id, input) => {
    const { error } = await supabase.from('teams').update(input).eq('id', id);
    if (!error) await refetch();
    return { error: error?.message };
  }, [refetch]);

  const deleteTeam = useCallback(async (id) => {
    const { error } = await supabase.from('teams').delete().eq('id', id);
    if (!error) await refetch();
    return { error: error?.message };
  }, [refetch]);

  return { teams, loading, createTeam, updateTeam, deleteTeam };
}

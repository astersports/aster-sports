import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useSeason } from '../context/SeasonContext';

// Teams for the ACTIVE season (no season argument — reads the active season from
// SeasonContext), sorted by sort_order so the UI renders oldest-to-youngest
// (11U → 8U), with CRUD. Consumed by AdminTeamsPage, TeamsPage, TeamDetailPage,
// AccountPage. (Renamed from usePrograms per D-Q9 — "program" now means the
// programs entity only; this hook reads the `teams` table. Distinct from
// useTeams(orgId), which is the org-wide read-only team list.)
export function useActiveSeasonTeams() {
  const { orgId } = useAuth();
  const { activeSeason } = useSeason();
  const seasonId = activeSeason?.id ?? null;

  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    if (!orgId || !seasonId) {
      setTeams([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error: e } = await supabase
      .from('teams')
      .select('*')
      .eq('org_id', orgId)
      .eq('season_id', seasonId)
      .order('sort_order', { ascending: true });
    if (e) {
      console.error('useActiveSeasonTeams fetch:', e.message);
      setError(e.message);
      setTeams([]);
    } else {
      setError(null);
      setTeams(data ?? []);
    }
    setLoading(false);
  }, [orgId, seasonId]);

  // Microtask wrap pushes the synchronous setLoading(true) at the top of
  // refetch() out of the effect body, satisfying react-hooks/set-state-in-effect.
  useEffect(() => { Promise.resolve().then(refetch); }, [refetch]);

  const createTeam = useCallback(async (input) => {
    if (!orgId || !seasonId) return { error: 'No active season' };
    const { error: e } = await supabase
      .from('teams')
      .insert({ ...input, org_id: orgId, season_id: seasonId });
    if (!e) await refetch();
    return { error: e?.message };
  }, [orgId, seasonId, refetch]);

  const updateTeam = useCallback(async (id, input) => {
    const { error: e } = await supabase.from('teams').update(input).eq('id', id);
    if (!e) await refetch();
    return { error: e?.message };
  }, [refetch]);

  const deleteTeam = useCallback(async (id) => {
    const { error: e } = await supabase.from('teams').delete().eq('id', id);
    if (!e) await refetch();
    return { error: e?.message };
  }, [refetch]);

  return { teams, loading, error, refetch, createTeam, updateTeam, deleteTeam };
}

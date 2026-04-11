import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useSeason } from '../context/SeasonContext';

// Fetches programs (teams) for the active season, sorted by sort_order so
// the UI always renders oldest-to-youngest (11U → 8U). "Program" is the
// v2 UI term; the underlying table is `teams` — the two are 1:1 for now.
// Used by AdminTeamsPage, schedule filters, and the roster module.
export function usePrograms() {
  const { orgId } = useAuth();
  const { activeSeason } = useSeason();
  const seasonId = activeSeason?.id ?? null;

  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    if (!orgId || !seasonId) {
      setPrograms([]);
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
      console.error('usePrograms fetch:', e.message);
      setError(e.message);
      setPrograms([]);
    } else {
      setError(null);
      setPrograms(data ?? []);
    }
    setLoading(false);
  }, [orgId, seasonId]);

  // Microtask wrap pushes the synchronous setLoading(true) at the top of
  // refetch() out of the effect body, satisfying react-hooks/set-state-in-effect.
  useEffect(() => { Promise.resolve().then(refetch); }, [refetch]);

  const createProgram = useCallback(async (input) => {
    if (!orgId || !seasonId) return { error: 'No active season' };
    const { error: e } = await supabase
      .from('teams')
      .insert({ ...input, org_id: orgId, season_id: seasonId });
    if (!e) await refetch();
    return { error: e?.message };
  }, [orgId, seasonId, refetch]);

  const updateProgram = useCallback(async (id, input) => {
    const { error: e } = await supabase.from('teams').update(input).eq('id', id);
    if (!e) await refetch();
    return { error: e?.message };
  }, [refetch]);

  const deleteProgram = useCallback(async (id) => {
    const { error: e } = await supabase.from('teams').delete().eq('id', id);
    if (!e) await refetch();
    return { error: e?.message };
  }, [refetch]);

  return { programs, loading, error, refetch, createProgram, updateProgram, deleteProgram };
}

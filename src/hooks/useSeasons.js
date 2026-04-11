import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

// CRUD-lite hook around the `seasons` table. Fetches all seasons for the
// current org, and exposes create/update/setActive mutations plus a manual
// refetch. `setActive` is a two-step transaction in application code —
// Postgres doesn't enforce "only one active per org", so we archive all
// others and then promote the target row.
export function useSeasons() {
  const { orgId } = useAuth();
  const [seasons, setSeasons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    if (!orgId) { setSeasons([]); setLoading(false); return; }
    setLoading(true);
    const { data, error: e } = await supabase
      .from('seasons')
      .select('*')
      .eq('org_id', orgId)
      .order('start_date', { ascending: false });
    if (e) {
      console.error('useSeasons fetch:', e.message);
      setError(e.message);
      setSeasons([]);
    } else {
      setError(null);
      setSeasons(data ?? []);
    }
    setLoading(false);
  }, [orgId]);

  // Microtask wrap pushes the synchronous setLoading(true) at the top of
  // refetch() out of the effect body, satisfying react-hooks/set-state-in-effect.
  useEffect(() => { Promise.resolve().then(refetch); }, [refetch]);

  const createSeason = useCallback(async (input) => {
    if (!orgId) return { error: 'No organization' };
    const { error: e } = await supabase
      .from('seasons')
      .insert({ ...input, org_id: orgId });
    if (!e) await refetch();
    return { error: e?.message };
  }, [orgId, refetch]);

  const updateSeason = useCallback(async (id, input) => {
    const { error: e } = await supabase
      .from('seasons').update(input).eq('id', id);
    if (!e) await refetch();
    return { error: e?.message };
  }, [refetch]);

  // Archive every other season in the org, then activate the chosen one.
  // Two statements because Postgres can't express "set exactly one row" in
  // a single update, and the check constraint already guarantees valid
  // status values.
  const setActive = useCallback(async (id) => {
    if (!orgId) return { error: 'No organization' };
    const { error: e1 } = await supabase
      .from('seasons').update({ status: 'archived' })
      .eq('org_id', orgId).neq('id', id);
    if (e1) return { error: e1.message };
    const { error: e2 } = await supabase
      .from('seasons').update({ status: 'active' }).eq('id', id);
    if (!e2) await refetch();
    return { error: e2?.message };
  }, [orgId, refetch]);

  return { seasons, loading, error, refetch, createSeason, updateSeason, setActive };
}

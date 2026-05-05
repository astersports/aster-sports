import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function useSeasonLocations(seasonId) {
  const [activeIds, setActiveIds] = useState(new Set());
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!seasonId) { setActiveIds(new Set()); setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('season_locations')
      .select('location_id')
      .eq('season_id', seasonId);
    if (error) console.error('useSeasonLocations:', error.message);
    setActiveIds(new Set((data || []).map((r) => r.location_id)));
    setLoading(false);
  }, [seasonId]);

  useEffect(() => { Promise.resolve().then(refetch); }, [refetch]);

  const setSeasonLocations = useCallback(async (nextIds) => {
    if (!seasonId) return { error: new Error('No seasonId') };
    const next = new Set(nextIds);
    const toAdd = [...next].filter((id) => !activeIds.has(id));
    const toRemove = [...activeIds].filter((id) => !next.has(id));
    if (toAdd.length) {
      const rows = toAdd.map((location_id) => ({ season_id: seasonId, location_id }));
      const { error } = await supabase.from('season_locations').insert(rows);
      if (error) return { error };
    }
    if (toRemove.length) {
      const { error } = await supabase.from('season_locations')
        .delete().eq('season_id', seasonId).in('location_id', toRemove);
      if (error) return { error };
    }
    await refetch();
    return { data: true };
  }, [seasonId, activeIds, refetch]);

  return { activeIds, loading, setSeasonLocations, refetch };
}

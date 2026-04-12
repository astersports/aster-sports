import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useSeason } from '../context/SeasonContext';

export function useActivities() {
  const { orgId } = useAuth();
  const { activeSeason } = useSeason();
  const seasonId = activeSeason?.id ?? null;
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!orgId) { setLoading(false); return; }
    setLoading(true);
    try {
      let query = supabase
        .from('events')
        .select('*, teams(id, name, team_color, age_group, circuit)')
        .eq('org_id', orgId)
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });
      if (seasonId) query = query.eq('season_id', seasonId);
      const { data, error } = await query;
      if (error) throw error;
      setActivities(data || []);
    } catch (err) {
      console.error('useActivities:', err.message);
      setActivities([]);
    }
    setLoading(false);
  }, [orgId, seasonId]);

  useEffect(() => {
    Promise.resolve().then(refetch);
  }, [refetch]);

  return { activities, loading, refetch };
}

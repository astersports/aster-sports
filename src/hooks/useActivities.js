import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useSeason } from '../context/SeasonContext';

// Queries the events table and normalizes columns for downstream
// components. The DB stores a single `start_at` timestamptz; we split
// it into `date` (YYYY-MM-DD) and `start_time` (HH:MM) so DayStrip,
// EventCard, CompactCard, and CountdownBanner can use simple strings.
// `location` is aliased to `location_name` for the same reason.
//
// org_id and season_id live on the `teams` table, not `events`, so we
// use an inner join + filter on the joined columns.
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
        .select('*, teams!inner(id, name, team_color, age_group, circuit, org_id, season_id)')
        .eq('teams.org_id', orgId)
        .order('start_at', { ascending: true });
      if (seasonId) query = query.eq('teams.season_id', seasonId);
      const { data, error } = await query;
      if (error) throw error;
      const processed = (data || []).map((e) => ({
        ...e,
        date: e.start_at ? e.start_at.slice(0, 10) : null,
        start_time: e.start_at ? new Date(e.start_at).toTimeString().slice(0, 5) : null,
        location_name: e.location || null,
      }));
      setActivities(processed);
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

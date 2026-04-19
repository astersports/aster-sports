import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useSeason } from '../context/SeasonContext';

// Module-level cache. Keyed by (orgId, seasonId, role, myTeamIds) so that
// navigating between Home / Schedule / Event Detail doesn't refetch on
// every mount. Second mount reads the cache instantly and refetches
// silently in the background.
const cache = { key: null, data: null };

const buildKey = (orgId, seasonId, role, myTeamIds) =>
  `${orgId || ''}:${seasonId || ''}:${role || ''}:${(myTeamIds || []).join(',')}`;

// Queries the events table and normalizes columns for downstream
// components. The DB stores a single `start_at` timestamptz; we split
// it into `date` (YYYY-MM-DD) and `start_time` (HH:MM) so DayStrip,
// EventCard, CompactCard, and CountdownBanner can use simple strings.
// `location` is aliased to `location_name` for the same reason.
export function useActivities() {
  const { orgId, role, myTeamIds } = useAuth();
  const { activeSeason } = useSeason();
  const seasonId = activeSeason?.id ?? null;
  const key = buildKey(orgId, seasonId, role, myTeamIds);
  const hasCached = cache.key === key && cache.data;
  const [activities, setActivities] = useState(() => hasCached ? cache.data : []);
  const [loading, setLoading] = useState(() => !hasCached);

  const refetch = useCallback(async () => {
    if (!orgId) { setLoading(false); return; }
    if (role === 'parent' && (!myTeamIds || myTeamIds.length === 0)) {
      cache.key = key; cache.data = [];
      setActivities([]); setLoading(false); return;
    }
    try {
      let query = supabase
        .from('events')
        .select('*, teams!inner(id, name, team_color, age_group, circuit, org_id, season_id, sort_order)')
        .eq('teams.org_id', orgId)
        .order('start_at', { ascending: true });
      if (seasonId) query = query.eq('teams.season_id', seasonId);
      if (role === 'parent' && myTeamIds?.length) query = query.in('team_id', myTeamIds);
      const { data, error } = await query;
      if (error) throw error;
      const processed = (data || []).map((e) => ({
        ...e,
        date: e.start_at ? e.start_at.slice(0, 10) : null,
        start_time: e.start_at ? new Date(e.start_at).toTimeString().slice(0, 5) : null,
        location_name: e.location || null,
      }));
      cache.key = key; cache.data = processed;
      setActivities(processed);
    } catch (err) {
      console.error('useActivities:', err.message);
      setActivities([]);
    }
    setLoading(false);
  }, [orgId, seasonId, role, myTeamIds, key]);

  useEffect(() => {
    Promise.resolve().then(refetch);
  }, [refetch]);

  return { activities, loading, refetch };
}

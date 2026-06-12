import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useSeason } from '../context/SeasonContext';
import { registerCacheBuster } from '../lib/cacheBuster';

const cache = { key: null, data: null };
registerCacheBuster(() => { cache.key = null; cache.data = null; });

const buildKey = (orgId, seasonId, role, myTeamIds) =>
  `${orgId || ''}:${seasonId || ''}:${role || ''}:${(myTeamIds || []).join(',')}`;

// Queries the events table and aliases `location` → `location_name` so
// EventCard and the ical export use a stable column name. Earlier
// `date` / `start_time` / `end_date` projections removed in 3d-g.1 —
// they had no consumers and held a UTC-slice anti-pattern that future
// consumers would have inherited.
export function useActivities() {
  const { orgId, role, myTeamIds } = useAuth();
  const { activeSeason } = useSeason();
  const seasonId = activeSeason?.id ?? null;
  const key = buildKey(orgId, seasonId, role, myTeamIds);
  const hasCached = cache.key === key && cache.data;
  const [activities, setActivities] = useState(() => hasCached ? cache.data : []);
  const [loading, setLoading] = useState(() => !hasCached);
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    if (!orgId) { setLoading(false); return; }
    if (!cache.data) setLoading(true);
    setError(null);
    if ((role === 'parent' || role === 'coach') && (!myTeamIds || myTeamIds.length === 0)) {
      cache.key = key; cache.data = [];
      setActivities([]); setLoading(false); return;
    }
    try {
      let query = supabase
        .from('events')
        .select('*, teams!inner(id, name, team_color, age_group, circuit, org_id, season_id, sort_order, roster_visibility_override), locations(name, google_maps_url, lat, lon, address)')
        .eq('teams.org_id', orgId)
        .order('start_at', { ascending: true });
      if (seasonId) query = query.eq('teams.season_id', seasonId);
      if ((role === 'parent' || role === 'coach') && myTeamIds?.length) query = query.in('team_id', myTeamIds);
      const { data, error: fetchErr } = await query;
      if (fetchErr) throw fetchErr;
      // Beta B5 audit Finding 1 — tournament events have location_id +
      // sub_location populated by the parser but events.location text
      // column null. Fall back to joined locations.name so the schedule
      // list renders a venue line on tournament events.
      const processed = (data || []).map((e) => ({ ...e, location_name: e.location || e.locations?.name || null }));
      cache.key = key; cache.data = processed;
      setActivities(processed);
    } catch (err) {
      // Preserve last-known-good activities on transient failure. The
      // error surfaces separately so consumers can render \"Couldn't
      // refresh — retry\" without wiping the screen.
      console.error('useActivities:', err.message);
      setError(err);
    }
    setLoading(false);
  }, [orgId, seasonId, role, myTeamIds, key]);

  useEffect(() => {
    Promise.resolve().then(refetch);
  }, [refetch]);

  return { activities, loading, error, refetch };
}

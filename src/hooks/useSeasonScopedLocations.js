import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// Returns location names scoped to the season's active set.
// Falls back to all org locations if the season has no rows yet
// (graceful migration — never show an empty dropdown).
export function useSeasonScopedLocations(orgId, seasonId) {
  const [locations, setLocations] = useState([]);

  useEffect(() => {
    if (!orgId) return;
    (async () => {
      let names = [];
      if (seasonId) {
        const { data, error } = await supabase
          .from('season_locations')
          .select('locations!inner(name, archived_at, org_id)')
          .eq('season_id', seasonId)
          .eq('locations.org_id', orgId)
          .is('locations.archived_at', null);
        if (error) console.error('useSeasonScopedLocations scoped:', error.message);
        names = (data || []).map((r) => r.locations.name).sort();
      }
      if (names.length === 0) {
        const { data, error } = await supabase
          .from('locations').select('name')
          .eq('org_id', orgId).is('archived_at', null).order('name');
        if (error) console.error('useSeasonScopedLocations all:', error.message);
        names = (data || []).map((r) => r.name);
      }
      setLocations(names);
    })();
  }, [orgId, seasonId]);

  return locations;
}

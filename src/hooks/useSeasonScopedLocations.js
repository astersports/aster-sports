import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// Returns season-scoped venue rows ({ id, name }) for the wizard.
// Falls back to all org locations if the season has no rows yet
// (graceful migration — never show an empty dropdown).
// 2026-06-13 locations audit: rows carry the id so the wizard writes
// events.location_id — name-only events fell to name-search directions,
// which Waze mis-resolved (ECS&F → Rippowam, operator-caught).
export function useSeasonScopedLocations(orgId, seasonId) {
  const [locations, setLocations] = useState([]);

  useEffect(() => {
    if (!orgId) return;
    let cancelled = false;
    (async () => {
      let rows = [];
      if (seasonId) {
        const { data, error } = await supabase
          .from('season_locations')
          .select('locations!inner(id, name, archived_at, org_id)')
          .eq('season_id', seasonId)
          .eq('locations.org_id', orgId)
          .is('locations.archived_at', null);
        if (error) console.error('useSeasonScopedLocations scoped:', error.message);
        rows = (data || []).map((r) => ({ id: r.locations.id, name: r.locations.name }))
          .sort((a, b) => a.name.localeCompare(b.name));
      }
      if (rows.length === 0) {
        const { data, error } = await supabase
          .from('locations').select('id, name')
          .eq('org_id', orgId).is('archived_at', null).order('name');
        if (error) console.error('useSeasonScopedLocations all:', error.message);
        rows = (data || []).map((r) => ({ id: r.id, name: r.name }));
      }
      if (cancelled) return;
      setLocations(rows);
    })();
    return () => { cancelled = true; };
  }, [orgId, seasonId]);

  return locations;
}

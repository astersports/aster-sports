import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { registerCacheBuster } from '../lib/cacheBuster';

const cache = new Map();
registerCacheBuster(() => cache.clear());
const cacheKey = (orgId, search, showArchived) =>
  `${orgId}:${search || ''}:${showArchived ? 'archived' : 'active'}`;

// Fetches locations for the org. When showArchived=true, returns archived rows
// instead of active. Optional search filters by name or address. Exposes CRUD
// mutations. Every query scoped to org_id.

export function useLocations({ search = '', showArchived = false } = {}) {
  const { orgId } = useAuth();
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    if (!orgId) return;
    cache.delete(cacheKey(orgId, search, showArchived));
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('locations')
        .select('id, name, address, parking_notes, notes, lat, lon, sub_locations, google_maps_url, entry_instructions')
        .eq('org_id', orgId)
        .order('name', { ascending: true });
      query = showArchived
        ? query.not('archived_at', 'is', null)
        : query.is('archived_at', null);

      const { data, error: err } = await query;
      if (err) throw err;

      let rows = data || [];
      if (search.trim()) {
        const q = search.toLowerCase();
        rows = rows.filter((l) =>
          l.name?.toLowerCase().includes(q) ||
          l.address?.toLowerCase().includes(q)
        );
      }
      setLocations([...rows]);
      cache.set(cacheKey(orgId, search, showArchived), rows);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [orgId, search, showArchived]);

  useEffect(() => {
    const cached = cache.get(cacheKey(orgId, search, showArchived));
    if (cached) { setLocations(cached); setLoading(false); }
    fetch();
  }, [fetch, orgId, search, showArchived]);

  const create = async (fields) => {
    if (!orgId) return { error: new Error('No orgId') };
    const { data, error: err } = await supabase
      .from('locations')
      .insert({ ...fields, org_id: orgId })
      .select().single();
    if (err) return { error: err };
    await fetch();
    return { data };
  };

  const update = async (id, fields) => {
    const { error: err } = await supabase
      .from('locations').update(fields).eq('id', id);
    if (err) return { error: err };
    await fetch();
    return { data: true };
  };

  const archive = async (id) => {
    const { error: err } = await supabase
      .from('locations').update({ archived_at: new Date().toISOString() }).eq('id', id);
    if (err) return { error: err };
    await fetch();
    return { data: true };
  };

  const unarchive = async (id) => {
    const { error: err } = await supabase
      .from('locations').update({ archived_at: null }).eq('id', id);
    if (err) return { error: err };
    await fetch();
    return { data: true };
  };

  return { locations, loading, error, create, update, archive, unarchive, refetch: fetch };
}

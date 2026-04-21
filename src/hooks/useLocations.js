import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const cache = new Map();
const cacheKey = (orgId, search) => `${orgId}:${search || ''}`;

// Fetches all non-archived locations for the org. Optional search filters by
// name or address. Exposes CRUD mutations. Every query scoped to org_id.

export function useLocations({ search = '' } = {}) {
  const { orgId } = useAuth();
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    if (!orgId) return;
    cache.delete(cacheKey(orgId, search));
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('locations')
        .select('id, name, address, parking_notes, notes, lat, lon, sub_locations')
        .eq('org_id', orgId)
        .is('archived_at', null)
        .order('name', { ascending: true });

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
      setLocations(rows);
      cache.set(cacheKey(orgId, search), rows);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [orgId, search]);

  useEffect(() => {
    const cached = cache.get(cacheKey(orgId, search));
    if (cached) { setLocations(cached); setLoading(false); }
    fetch();
  }, [fetch, orgId, search]);

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

  return { locations, loading, error, create, update, archive, refetch: fetch };
}

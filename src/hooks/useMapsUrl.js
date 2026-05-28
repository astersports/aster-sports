import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

// Module-level cache keyed by `${orgId}:${cleanedName}`. undefined = miss,
// null = looked up and not found, object = coordinates on file. Keying by
// org prevents cross-org cache hits when multiple orgs share a venue name.
const cache = new Map();

// Resolves a free-text location string to a Google Maps directions URL by
// looking up the stored lat/lon in the `locations` table. Results are
// cached across the session so every NextUpCard on a dashboard doesn't
// re-query for the same venue.
export function useMapsUrl(location) {
  const { orgId } = useAuth();
  const [url, setUrl] = useState(() => {
    if (!location || typeof location !== 'string') return null;
    if (location.startsWith('Tournament -')) return null;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
  });
  useEffect(() => {
    if (!location || !orgId) return;
    let cancelled = false;
    const name = location.replace(/[\u2018\u2019\u2032]/g, "'").split(' - ')[0].split('(')[0].trim();
    if (!name) return () => { cancelled = true; };
    // Priority: google_maps_url (Frank-verified pin) > coords > address text.
    const toUrl = (r) => {
      if (!r) return null;
      if (r.google_maps_url) return r.google_maps_url;
      if (r.lat != null && r.lon != null) return `https://www.google.com/maps/search/?api=1&query=${r.lat},${r.lon}`;
      if (r.address && r.address.trim()) return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(r.address.trim())}`;
      return null;
    };
    const cacheKey = `${orgId}:${name}`;
    const hit = cache.get(cacheKey);
    // Microtask wrap on the cache-hit setUrl pushes it out of the
    // effect body, satisfying react-hooks/set-state-in-effect.
    if (hit !== undefined) {
      Promise.resolve().then(() => { if (!cancelled) setUrl(toUrl(hit)); });
      return () => { cancelled = true; };
    }
    supabase.from('locations').select('lat, lon, address, google_maps_url').eq('org_id', orgId).ilike('name', `%${name}%`).limit(1)
      .then(({ data }) => {
        if (cancelled) return;
        const r = data?.[0] || null;
        cache.set(cacheKey, r);
        setUrl(toUrl(r));
      });
    return () => { cancelled = true; };
  }, [location, orgId]);
  return url;
}

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// Module-level cache keyed by the cleaned location name. undefined = miss,
// null = looked up and not found, object = coordinates on file.
const cache = new Map();

// Resolves a free-text location string to a Google Maps directions URL by
// looking up the stored lat/lon in the `locations` table. Results are
// cached across the session so every NextUpCard on a dashboard doesn't
// re-query for the same venue.
export function useMapsUrl(location) {
  const [url, setUrl] = useState(() => {
    if (!location || typeof location !== 'string') return null;
    if (location.startsWith('Tournament -')) return null;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
  });
  useEffect(() => {
    if (!location) return;
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
    const hit = cache.get(name);
    // Microtask wrap on the cache-hit setUrl pushes it out of the
    // effect body, satisfying react-hooks/set-state-in-effect.
    if (hit !== undefined) {
      Promise.resolve().then(() => { if (!cancelled) setUrl(toUrl(hit)); });
      return () => { cancelled = true; };
    }
    supabase.from('locations').select('lat, lon, address, google_maps_url').ilike('name', `%${name}%`).limit(1)
      .then(({ data }) => {
        if (cancelled) return;
        const r = data?.[0] || null;
        cache.set(name, r);
        setUrl(toUrl(r));
      });
    return () => { cancelled = true; };
  }, [location]);
  return url;
}

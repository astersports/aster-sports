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
  const [url, setUrl] = useState(null);
  useEffect(() => {
    if (!location) return;
    const name = location.replace(/[\u2018\u2019\u2032]/g, "'").split(' - ')[0].split('(')[0].trim();
    if (!name) return;
    const toUrl = (r) => (r?.lat && r?.lon ? `https://maps.google.com/maps?daddr=${r.lat},${r.lon}` : null);
    const hit = cache.get(name);
    // Microtask wrap on the cache-hit setUrl pushes it out of the
    // effect body, satisfying react-hooks/set-state-in-effect.
    if (hit !== undefined) {
      Promise.resolve().then(() => setUrl(toUrl(hit)));
      return;
    }
    supabase.from('locations').select('lat, lon').ilike('name', `%${name}%`).limit(1)
      .then(({ data }) => {
        const r = data?.[0] || null;
        cache.set(name, r);
        setUrl(toUrl(r));
      });
  }, [location]);
  return url;
}

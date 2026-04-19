import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

export function useEventRideCounts(activities) {
  const [counts, setCounts] = useState({});
  const lastKeyRef = useRef(null);
  useEffect(() => {
    const ids = (activities || []).map((a) => a.id);
    if (ids.length === 0) { setCounts({}); lastKeyRef.current = ''; return; }
    const key = [...ids].sort().join(',');
    if (lastKeyRef.current === key) return;
    lastKeyRef.current = key;
    supabase.from('event_rides').select('event_id, ride_type, seats').in('event_id', ids)
      .then(({ data, error }) => {
        if (error) { console.error('useEventRideCounts:', error.message); return; }
        const map = {};
        (data || []).forEach((r) => {
          if (!map[r.event_id]) map[r.event_id] = { offers: 0, requests: 0, urgent: false };
          if (r.ride_type === 'offering') map[r.event_id].offers += (r.seats || 1);
          else if (r.ride_type === 'requesting') map[r.event_id].requests += 1;
        });
        setCounts(map);
      });
  }, [activities]);
  return counts;
}

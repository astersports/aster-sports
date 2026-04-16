import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useEventRideCounts(activities) {
  const [counts, setCounts] = useState({});
  useEffect(() => {
    const ids = (activities || []).map((a) => a.id);
    if (ids.length === 0) { setCounts({}); return; }
    supabase.from('event_rides').select('event_id, ride_type, seats, is_urgent').in('event_id', ids)
      .then(({ data }) => {
        if (!data) return;
        const map = {};
        data.forEach((r) => {
          if (!map[r.event_id]) map[r.event_id] = { offers: 0, requests: 0, urgent: false };
          if (r.ride_type === 'offering') map[r.event_id].offers += (r.seats || 1);
          else if (r.ride_type === 'requesting') {
            map[r.event_id].requests += 1;
            if (r.is_urgent) map[r.event_id].urgent = true;
          }
        });
        setCounts(map);
      });
  }, [activities]);
  return counts;
}

import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

export function useEventRideCounts(activities) {
  const [counts, setCounts] = useState({});
  const lastKeyRef = useRef(null);
  useEffect(() => {
    const ids = (activities || []).map((a) => a.id).filter(Boolean);
    if (ids.length === 0) {
      Promise.resolve().then(() => setCounts({}));
      lastKeyRef.current = '';
      return;
    }
    const key = [...ids].sort().join(',');
    if (lastKeyRef.current === key) return;
    lastKeyRef.current = key;
    Promise.all([
      supabase.from('event_ride_offers').select('event_id, seats_offered, status').in('event_id', ids).eq('status', 'active'),
      supabase.from('event_ride_claims').select('event_id, seats_requested, status').in('event_id', ids).in('status', ['pending', 'confirmed']),
    ]).then(([offersRes, claimsRes]) => {
      if (offersRes.error) { console.error('useEventRideCounts offers:', offersRes.error.message); return; }
      if (claimsRes.error) { console.error('useEventRideCounts claims:', claimsRes.error.message); return; }
      const map = {};
      for (const o of (offersRes.data || [])) {
        if (!map[o.event_id]) map[o.event_id] = { offers: 0, requests: 0, urgent: false };
        map[o.event_id].offers += (o.seats_offered || 1);
      }
      for (const c of (claimsRes.data || [])) {
        if (!map[c.event_id]) map[c.event_id] = { offers: 0, requests: 0, urgent: false };
        map[c.event_id].requests += (c.seats_requested || 1);
      }
      for (const id of Object.keys(map)) {
        if (map[id].requests > 0 && map[id].offers === 0) map[id].urgent = true;
      }
      setCounts(map);
    });
  }, [activities]);
  return counts;
}

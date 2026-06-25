import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

// L99 TIER 3 PATTERN A: value-stable key driven by sorted ids so the
// effect doesn't re-fire on upstream activities reference churn when the
// id set hasn't actually changed.
export function useEventRideCounts(activities) {
  const [counts, setCounts] = useState({});
  const [version, setVersion] = useState(0);

  const stableKey = useMemo(() => {
    const ids = (activities || []).map((a) => a.id).filter(Boolean);
    return [...ids].sort().join(',');
  }, [activities]);

  useEffect(() => {
    let cancelled = false;
    if (!stableKey) {
      Promise.resolve().then(() => { if (!cancelled) setCounts({}); });
      return () => { cancelled = true; };
    }
    const ids = stableKey.split(',');
    Promise.all([
      supabase.from('event_ride_offers').select('event_id, seats_offered, status').in('event_id', ids).eq('status', 'active'),
      supabase.from('event_ride_claims').select('event_id, seats_requested, status').in('event_id', ids).in('status', ['pending', 'confirmed']),
      supabase.from('event_ride_requests').select('event_id, seats_needed, status').in('event_id', ids).eq('status', 'open'),
    ]).then(([offersRes, claimsRes, requestsRes]) => {
      if (cancelled) return;
      if (offersRes.error) { console.error('useEventRideCounts offers:', offersRes.error.message); return; }
      if (claimsRes.error) { console.error('useEventRideCounts claims:', claimsRes.error.message); return; }
      if (requestsRes?.error) { console.error('useEventRideCounts requests:', requestsRes.error.message); return; }
      const map = {};
      for (const o of (offersRes.data || [])) {
        if (!map[o.event_id]) map[o.event_id] = { offers: 0, requests: 0, urgent: false };
        map[o.event_id].offers += (o.seats_offered || 1);
      }
      for (const c of (claimsRes.data || [])) {
        if (!map[c.event_id]) map[c.event_id] = { offers: 0, requests: 0, urgent: false };
        map[c.event_id].requests += (c.seats_requested || 1);
      }
      for (const r of (requestsRes?.data || [])) {
        if (!map[r.event_id]) map[r.event_id] = { offers: 0, requests: 0, urgent: false };
        map[r.event_id].requests += (r.seats_needed || 1);
      }
      for (const id of Object.keys(map)) {
        if (map[id].requests > 0 && map[id].offers === 0) map[id].urgent = true;
      }
      setCounts(map);
    }).catch((err) => {
      if (cancelled) return;
      console.error('useEventRideCounts network error:', err);
    });
    return () => { cancelled = true; };
  }, [stableKey, version]);

  const refetch = useCallback(() => setVersion((v) => v + 1), []);
  return { counts, refetch };
}

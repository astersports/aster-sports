import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

// Per-event duty counts: { [event_id]: { total, claimed } }.
// A duty is "claimed" when either claimed_by_name (anonymous signup)
// or guardian_id (signed-in guardian pickup) is set.
export function useEventDutyCounts(activities) {
  const [counts, setCounts] = useState({});
  const lastKeyRef = useRef(null);
  // Microtask wrap on the early-return setCounts({}) pushes it out of
  // the effect body, satisfying react-hooks/set-state-in-effect.
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
    supabase.from('event_duties').select('event_id, claimed_by_name, guardian_id').in('event_id', ids)
      .then(({ data, error }) => {
        if (error) { console.warn('useEventDutyCounts:', error.message); return; }
        if (!data) return;
        const map = {};
        data.forEach((r) => {
          if (!map[r.event_id]) map[r.event_id] = { total: 0, claimed: 0 };
          map[r.event_id].total += 1;
          if (r.guardian_id || r.claimed_by_name) map[r.event_id].claimed += 1;
        });
        setCounts(map);
      });
  }, [activities]);
  return counts;
}

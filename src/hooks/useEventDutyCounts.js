import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

// Per-event duty counts: { [event_id]: { total, claimed, openNames } }.
// A duty is "claimed" when either claimed_by_name (anonymous signup)
// or guardian_id (signed-in guardian pickup) is set. openNames (PR-V4)
// carries the UNCLAIMED slot names so the detailed card can say
// "Snacks open" instead of a generic volunteer count.
//
// L99 TIER 3 PATTERN A: value-stable key driven by sorted ids so the
// effect doesn't re-fire on upstream activities reference churn when the
// id set hasn't actually changed. ids are recovered from the key inside
// the effect so we don't need activities in the dep array.
export function useEventDutyCounts(activities) {
  const [counts, setCounts] = useState({});
  const [version, setVersion] = useState(0);

  const stableKey = useMemo(() => {
    const ids = (activities || []).map((a) => a.id).filter(Boolean);
    return [...ids].sort().join(',');
  }, [activities]);

  useEffect(() => {
    if (!stableKey) {
      Promise.resolve().then(() => setCounts({}));
      return;
    }
    const ids = stableKey.split(',');
    supabase.from('event_duties').select('event_id, duty_name, claimed_by_name, guardian_id').in('event_id', ids)
      .then(({ data, error }) => {
        if (error) { console.warn('useEventDutyCounts:', error.message); return; }
        if (!data) return;
        const map = {};
        data.forEach((r) => {
          if (!map[r.event_id]) map[r.event_id] = { total: 0, claimed: 0, openNames: [] };
          map[r.event_id].total += 1;
          if (r.guardian_id || r.claimed_by_name) map[r.event_id].claimed += 1;
          else if (r.duty_name) map[r.event_id].openNames.push(r.duty_name);
        });
        setCounts(map);
      });
  }, [stableKey, version]);

  const refetch = useCallback(() => setVersion((v) => v + 1), []);
  return { counts, refetch };
}

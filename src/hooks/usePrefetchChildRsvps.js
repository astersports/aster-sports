import { useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { responseCache, cacheKey } from '../lib/rsvpCache';

export function usePrefetchChildRsvps(activities, myChildren) {
  const playerIds = useMemo(() => (myChildren || []).map((c) => c.playerId).filter(Boolean), [myChildren]);
  const eventIds = useMemo(() => activities.filter((a) => a.start_at && a.status !== 'cancelled').map((a) => a.id), [activities]);

  useEffect(() => {
    if (!playerIds.length || !eventIds.length) return;
    let cancelled = false;
    Promise.resolve().then(async () => {
      const { data } = await supabase.from('event_rsvps').select('event_id, player_id, response')
        .in('event_id', eventIds).in('player_id', playerIds);
      if (cancelled) return;
      for (const r of (data || [])) responseCache.set(cacheKey(r.event_id, r.player_id), r.response);
    });
    return () => { cancelled = true; };
  }, [playerIds, eventIds]);
}

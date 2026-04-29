// src/hooks/useChildRsvpsForEvents.js
// Resolves the parent's child RSVPs for a list of events in one batched
// query. Returns { [event_id]: [{ playerId, firstName, response }] } where
// response is 'going' | 'maybe' | 'not_going' | null. Children whose teamId
// matches the event but who have no event_rsvps row appear with response=null.
//
// Module-level cache keyed by sorted (eventIds + playerIds) string so home
// re-renders don't re-fetch. Eventids and playerIds both .filter(Boolean) per
// the Y0 uuid-undefined boundary fix.

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';

const cache = new Map();

export function useChildRsvpsForEvents(activities, myChildren) {
  const eventIds = useMemo(
    () => (activities || []).map((a) => a.id).filter(Boolean),
    [activities],
  );
  const playerIds = useMemo(
    () => (myChildren || []).map((c) => c.playerId).filter(Boolean),
    [myChildren],
  );
  const cacheKey = useMemo(
    () => `${[...eventIds].sort().join(',')}|${[...playerIds].sort().join(',')}`,
    [eventIds, playerIds],
  );

  const [byEvent, setByEvent] = useState(() => cache.get(cacheKey) || {});

  useEffect(() => {
    if (eventIds.length === 0 || playerIds.length === 0) {
      Promise.resolve().then(() => setByEvent({}));
      return;
    }
    if (cache.has(cacheKey)) {
      Promise.resolve().then(() => setByEvent(cache.get(cacheKey)));
      return;
    }
    let cancelled = false;
    supabase.from('event_rsvps').select('event_id, player_id, response')
      .in('event_id', eventIds).in('player_id', playerIds)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) { console.error('useChildRsvpsForEvents:', error.message); return; }
        const respByKey = new Map();
        (data || []).forEach((r) => respByKey.set(`${r.event_id}:${r.player_id}`, r.response));
        const result = {};
        (activities || []).forEach((a) => {
          if (!a?.id) return;
          const kidsOnTeam = (myChildren || []).filter((c) => c.teamId === a.team_id);
          if (kidsOnTeam.length === 0) return;
          result[a.id] = kidsOnTeam.map((c) => ({
            playerId: c.playerId,
            firstName: c.firstName,
            response: respByKey.get(`${a.id}:${c.playerId}`) ?? null,
          }));
        });
        cache.set(cacheKey, result);
        setByEvent(result);
      });
    return () => { cancelled = true; };
  }, [cacheKey, eventIds, playerIds, activities, myChildren]);

  return byEvent;
}

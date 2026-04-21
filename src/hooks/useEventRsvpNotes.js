import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

// Module-level cache keyed by eventId. Survives component unmount so
// NextUpCard doesn't re-query every time the parent home re-renders.
const cache = new Map();

// Ordering: non-going responses surface first (admins care most about
// exceptions to "coming"), then going, then anything else. Within each
// group, alphabetical by first name.
const GROUP_ORDER = { maybe: 0, not_going: 1, going: 2 };
function orderNotes(rows) {
  return [...rows].sort((a, b) => {
    const ga = GROUP_ORDER[a.response] ?? 3;
    const gb = GROUP_ORDER[b.response] ?? 3;
    if (ga !== gb) return ga - gb;
    return (a.firstName || '').localeCompare(b.firstName || '');
  });
}

// Fetches event_rsvps with non-empty comments for a single event, joins
// players for first_name, and returns an ordered array. Callers slice
// to show the first N and compute "+M more" from the total length.
export function useEventRsvpNotes(eventId) {
  const [notes, setNotes] = useState(() => (eventId && cache.get(eventId)) || []);
  const didInitialLoad = useRef(false);

  useEffect(() => {
    if (!eventId) return;
    let cancelled = false;
    const run = async () => {
      const { data, error } = await supabase
        .from('event_rsvps')
        .select('player_id, response, comment')
        .eq('event_id', eventId);
      if (cancelled) return;
      if (error) { console.error('useEventRsvpNotes:', error.message); return; }
      const mapped = (data || [])
        .filter((r) => r.comment && r.comment.trim() !== '')
        .map((r) => ({
          playerId: r.player_id,
          firstName: 'Player', // temporary until we fix the join
          response: r.response,
          comment: r.comment,
        }));
      // TEMP DEBUG - remove after diagnosis
      console.log('[useEventRsvpNotes]', {
        eventId,
        count: data?.length,
        firstRow: data?.[0],
        firstRowPlayers: data?.[0]?.players,
        mapped,
      });
      const ordered = orderNotes(mapped);
      cache.set(eventId, ordered);
      setNotes(ordered);
      didInitialLoad.current = true;
    };
    Promise.resolve().then(run);
    return () => { cancelled = true; };
  }, [eventId]);

  return notes;
}

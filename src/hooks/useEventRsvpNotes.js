import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { registerCacheBuster } from '../lib/cacheBuster';

const cache = new Map();
registerCacheBuster(() => cache.clear());

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

// Fetches event_rsvps with non-empty comments for a single event and
// merges in player first_names via a second query. Two queries instead
// of an implicit PostgREST join because the FK cache for
// event_rsvps.player_id → players.id silently returns zero rows.
// Callers slice the result to show the first N and compute "+M more".
export function useEventRsvpNotes(eventId) {
  const [notes, setNotes] = useState(() => (eventId && cache.get(eventId)) || []);
  const didInitialLoad = useRef(false);

  useEffect(() => {
    if (!eventId) return;
    let cancelled = false;
    const run = async () => {
      const { data: rsvpData, error: rsvpError } = await supabase
        .from('event_rsvps')
        .select('player_id, response, comment')
        .eq('event_id', eventId);
      if (cancelled) return;
      if (rsvpError) { console.error('useEventRsvpNotes rsvp:', rsvpError.message); return; }

      const withComments = (rsvpData || []).filter(
        (r) => r.comment && r.comment.trim() !== ''
      );
      if (withComments.length === 0) {
        cache.set(eventId, []);
        setNotes([]);
        didInitialLoad.current = true;
        return;
      }

      const playerIds = withComments.map((r) => r.player_id);
      const { data: playerData, error: playerError } = await supabase
        .from('players')
        .select('id, first_name')
        .in('id', playerIds);
      if (cancelled) return;
      if (playerError) console.error('useEventRsvpNotes player:', playerError.message);

      const nameById = new Map((playerData || []).map((p) => [p.id, p.first_name]));
      const mapped = withComments.map((r) => ({
        playerId: r.player_id,
        firstName: nameById.get(r.player_id) || 'Player',
        response: r.response,
        comment: r.comment,
      }));
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

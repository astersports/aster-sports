import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/useToast';

export function useRsvps(eventId, teamId) {
  const { showToast } = useToast();
  const [rsvps, setRsvps] = useState([]);
  const [roster, setRoster] = useState([]);
  const [loading, setLoading] = useState(true);
  const didInitialLoad = useRef(false);

  const fetch = useCallback(async () => {
    if (!eventId || !teamId) { setLoading(false); return; }
    if (!didInitialLoad.current) setLoading(true);
    const [rsvpRes, rosterRes] = await Promise.all([
      supabase.from('event_rsvps').select('*').eq('event_id', eventId),
      supabase
        .from('roster_members')
        .select('jersey_number, players(id, first_name, last_name, member_type)')
        .eq('team_id', teamId)
        .order('jersey_number', { ascending: true, nullsFirst: false }),
    ]);
    setRsvps(rsvpRes.data || []);
    const mapped = (rosterRes.data || []).map((rm) => ({
      id: rm.players.id,
      first_name: rm.players.first_name,
      last_name: rm.players.last_name,
      member_type: rm.players.member_type,
      jersey_number: rm.jersey_number,
    }));
    setRoster(mapped);
    didInitialLoad.current = true;
    setLoading(false);
  }, [eventId, teamId]);

  // Microtask wrap pushes the synchronous setLoading(true) at the top of
  // fetch() out of the effect body, satisfying react-hooks/set-state-in-effect.
  useEffect(() => { Promise.resolve().then(fetch); }, [fetch]);

  const setRsvp = async (playerId, response) => {
    const { error } = await supabase.from('event_rsvps').upsert(
      { event_id: eventId, player_id: playerId, response, responded_at: new Date().toISOString() },
      { onConflict: 'event_id,player_id' }
    );
    if (error) {
      console.error('setRsvp:', error.message);
      showToast('Could not save RSVP. Check your connection.', 'error');
      return false;
    }
    await fetch();
    return true;
  };

  const saveNote = async (playerId, comment) => {
    // Only update comment on existing RSVP rows — event_rsvps.response is NOT NULL
    const { data: existing } = await supabase
      .from('event_rsvps')
      .select('id')
      .eq('event_id', eventId)
      .eq('player_id', playerId)
      .maybeSingle();
    if (!existing) {
      console.warn('No RSVP exists for this player, cannot save note without RSVP');
      showToast('Set an RSVP before adding a note.', 'error');
      return false;
    }
    const { error } = await supabase
      .from('event_rsvps')
      .update({ comment })
      .eq('event_id', eventId)
      .eq('player_id', playerId);
    if (error) {
      console.error('saveNote:', error.message);
      showToast('Could not save note. Try again.', 'error');
      return false;
    }
    await fetch();
    return true;
  };

  return { rsvps, roster, loading, setRsvp, saveNote, refetch: fetch };
}

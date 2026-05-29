import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/useToast';
import { reportError } from '../lib/reportError';

export function useRsvps(eventId, teamId) {
  const { showToast } = useToast();
  const [rsvps, setRsvps] = useState([]);
  const [roster, setRoster] = useState([]);
  const [loading, setLoading] = useState(true);
  const didInitialLoad = useRef(false);
  const cancelledRef = useRef(false);

  const fetch = useCallback(async () => {
    if (!eventId || !teamId) { setLoading(false); return; }
    if (!didInitialLoad.current) setLoading(true);
    // §11.5 doctrine: team_players is canonical for "kids on a team right
    // now". .eq('status', 'active') is MCP-verified equivalent to
    // .is('left_at', null) on roster_members (per PR #125). Same player(...)
    // PostgREST embed shape; jersey_number sort behavior preserved.
    const [rsvpRes, rosterRes] = await Promise.all([
      supabase
        .from('event_rsvps')
        .select('id, event_id, player_id, guardian_id, response, comment, responded_at')
        .eq('event_id', eventId),
      supabase
        .from('team_players')
        .select('jersey_number, players(id, first_name, last_name, member_type)')
        .eq('team_id', teamId)
        .eq('status', 'active')
        .order('jersey_number', { ascending: true, nullsFirst: false }),
    ]);
    if (cancelledRef.current) return;
    setRsvps(rsvpRes.data || []);
    const mapped = (rosterRes.data || []).filter((rm) => rm.players).map((rm) => ({
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

  useEffect(() => { cancelledRef.current = false; Promise.resolve().then(fetch); return () => { cancelledRef.current = true; }; }, [fetch]);

  const setRsvp = async (playerId, response) => {
    const prev = rsvps;
    const existing = rsvps.find((r) => r.player_id === playerId);
    const optimistic = existing
      ? rsvps.map((r) => r.player_id === playerId ? { ...r, response } : r)
      : [...rsvps, { event_id: eventId, player_id: playerId, response, responded_at: new Date().toISOString() }];
    setRsvps(optimistic);
    const { error } = await supabase.from('event_rsvps').upsert(
      { event_id: eventId, player_id: playerId, response, responded_at: new Date().toISOString() },
      { onConflict: 'event_id,player_id' }
    );
    if (error) {
      setRsvps(prev);
      showToast("Looks like that didn't go through. Try again?", 'error');
      return false;
    }
    return true;
  };

  const saveNote = async (playerId, comment) => {
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
      reportError(error, { surface: 'useRsvps.saveNote', eventId, playerId });
      showToast('Could not save note. Try again.', 'error');
      return false;
    }
    await fetch();
    return true;
  };

  return { rsvps, roster, loading, setRsvp, saveNote, refetch: fetch };
}

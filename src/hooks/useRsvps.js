import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function useRsvps(eventId, teamId) {
  const [rsvps, setRsvps] = useState([]);
  const [roster, setRoster] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!eventId || !teamId) { setLoading(false); return; }
    setLoading(true);
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
    setLoading(false);
  }, [eventId, teamId]);

  useEffect(() => { fetch(); }, [fetch]);

  const setRsvp = async (playerId, response) => {
    const { error } = await supabase.from('event_rsvps').upsert(
      { event_id: eventId, player_id: playerId, response, responded_at: new Date().toISOString() },
      { onConflict: 'event_id,player_id' }
    );
    if (error) {
      console.error('setRsvp:', error.message);
      return;
    }
    await fetch();
  };

  return { rsvps, roster, loading, setRsvp, refetch: fetch };
}

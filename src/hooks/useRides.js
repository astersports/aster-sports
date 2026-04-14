import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

// Fetches event_rides for an event and exposes offer/request creators.
// type: 'offer' = driver with seats available; 'request' = rider
// needing a seat. Both stored in the same table with a discriminator.
export function useRides(eventId) {
  const { user } = useAuth();
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!eventId) { setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('event_rides').select('*').eq('event_id', eventId)
      .order('created_at', { ascending: true });
    if (error) console.error('useRides:', error.message);
    setRides(data || []);
    setLoading(false);
  }, [eventId]);

  useEffect(() => { fetch(); }, [fetch]);

  const create = async (payload) => {
    const authorName = user?.user_metadata?.full_name || user?.email || 'User';
    const { error } = await supabase.from('event_rides').insert({
      ...payload,
      event_id: eventId,
      created_by: user.id,
      author_name: authorName,
    });
    if (error) { console.error('create ride:', error.message); return false; }
    await fetch();
    return true;
  };

  const remove = async (rideId) => {
    const { error } = await supabase.from('event_rides')
      .delete().eq('id', rideId).eq('created_by', user.id);
    if (error) { console.error('remove ride:', error.message); return; }
    await fetch();
  };

  return { rides, loading, create, remove, refetch: fetch };
}

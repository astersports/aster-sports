import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

// Schema: event_rides uses (ride_type, pickup_location, departure_time,
// guardian_id, name, seats). ride_type is 'offering' (driver) or
// 'requesting' (rider needing a seat).
export function useRides(eventId) {
  const { user } = useAuth();
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const didInitialLoad = useRef(false);

  const fetch = useCallback(async () => {
    if (!eventId) { setLoading(false); return; }
    if (!didInitialLoad.current) setLoading(true);
    const { data, error } = await supabase
      .from('event_rides').select('*').eq('event_id', eventId)
      .order('created_at', { ascending: true });
    if (error) console.error('useRides:', error.message);
    setRides(data || []);
    didInitialLoad.current = true;
    setLoading(false);
  }, [eventId]);

  useEffect(() => { fetch(); }, [fetch]);

  const create = async (payload) => {
    const authorName = user?.user_metadata?.full_name || user?.email || 'User';
    console.log('Ride insert payload:', payload);
    // Build a real timestamp from the time-only input
    let depTime = null;
    if (payload.departure_time) {
      const eventDate = payload.event_date || new Date().toISOString().slice(0, 10);
      depTime = `${eventDate}T${payload.departure_time}:00`;
    }
    const { error } = await supabase.from('event_rides').insert({
      event_id: eventId,
      ride_type: payload.ride_type,
      pickup_location: payload.pickup_location || null,
      departure_time: depTime,
      seats: payload.seats || 1,
      notes: payload.notes || null,
      guardian_id: null,
      name: authorName,
      phone: payload.phone || null,
    });
    if (error) { console.error('Ride insert error:', error); return false; }
    await fetch();
    return true;
  };

  const remove = async (rideId) => {
    const { error } = await supabase.from('event_rides')
      .delete().eq('id', rideId).eq('guardian_id', user.id);
    if (error) { console.error('remove ride:', error.message); return; }
    await fetch();
  };

  return { rides, loading, create, remove, refetch: fetch };
}

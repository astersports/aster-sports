import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

// Schema: event_rides uses (ride_type, pickup_location, departure_time,
// guardian_id, name, seats). ride_type is 'offering' (driver) or
// 'requesting' (rider needing a seat).
export function useRides(eventId) {
  const { user, guardianId } = useAuth();
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
    const authorName = payload.authorName || user?.user_metadata?.full_name || user?.email || 'User';
    let depTime = null;
    if (payload.departure_time) {
      const eventDate = payload.event_date || new Date().toISOString().slice(0, 10);
      depTime = `${eventDate}T${payload.departure_time}:00`;
    }
    const row = {
      event_id: eventId,
      ride_type: payload.ride_type,
      pickup_location: payload.pickup_location || null,
      departure_time: depTime,
      seats: payload.seats || 1,
      notes: payload.notes || null,
      guardian_id: guardianId ?? null,
      name: authorName,
      phone: payload.phone || null,
    };
    // Dedup by guardian_id when available, else by name.
    const base = supabase.from('event_rides').select('id')
      .eq('event_id', eventId).eq('ride_type', payload.ride_type);
    const { data: existing } = await (guardianId
      ? base.eq('guardian_id', guardianId)
      : base.eq('name', authorName)).maybeSingle();
    const { error } = existing
      ? await supabase.from('event_rides').update(row).eq('id', existing.id)
      : await supabase.from('event_rides').insert(row);
    if (error) { window.alert(`Failed to save ride: ${error.message}`); return false; }
    await fetch();
    return true;
  };

  const claim = async (offer, authorName, phone) => {
    const row = {
      event_id: eventId,
      ride_type: 'requesting',
      pickup_location: null,
      departure_time: null,
      seats: 1,
      notes: `Riding with ${offer.name}`,
      guardian_id: guardianId ?? null,
      name: authorName || user?.user_metadata?.full_name || user?.email || 'User',
      phone: phone || null,
    };
    const { error } = await supabase.from('event_rides').insert(row);
    if (error) { window.alert(`Failed to claim seat: ${error.message}`); return false; }
    await fetch();
    return true;
  };

  const remove = async (rideId) => {
    const { error } = await supabase.from('event_rides')
      .delete().eq('id', rideId);
    if (error) { window.alert(`Failed to remove ride: ${error.message}`); return; }
    await fetch();
  };

  return { rides, loading, create, claim, remove, refetch: fetch };
}

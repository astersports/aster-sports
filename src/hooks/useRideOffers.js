// src/hooks/useRideOffers.js
// Phase 1.5 rides rebuild Phase A — driver-side hook.
// Fetches event_ride_offers for an event with Realtime subscription.
// postOffer + cancelOffer ship optimistic per CLAUDE.md §16.1.

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export function useRideOffers(eventId) {
  const { user, orgId } = useAuth();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOffers = useCallback(async () => {
    if (!eventId) {
      setOffers([]);
      setLoading(false);
      return;
    }
    setError(null);
    const { data, error: fetchError } = await supabase
      .from('event_ride_offers')
      .select('*')
      .eq('event_id', eventId)
      .eq('status', 'active')
      .order('created_at', { ascending: true });
    if (fetchError) setError(fetchError);
    else setOffers(data || []);
    setLoading(false);
  }, [eventId]);

  useEffect(() => {
    fetchOffers();
  }, [fetchOffers]);

  // Realtime: any change to offers for this event refetches.
  useEffect(() => {
    if (!eventId) return undefined;
    const channel = supabase
      .channel(`event_ride_offers:${eventId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'event_ride_offers', filter: `event_id=eq.${eventId}` }, fetchOffers)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [eventId, fetchOffers]);

  // postOffer: optimistic insert, rollback on error.
  const postOffer = useCallback(async (input) => {
    if (!user || !orgId || !eventId) {
      return { ok: false, error: new Error('Missing user/org/event context') };
    }
    const tempId = `temp-${Date.now()}`;
    const optimistic = {
      id: tempId,
      event_id: eventId,
      org_id: orgId,
      driver_user_id: user.id,
      seats_offered: input.seats_offered,
      ride_type: input.ride_type ?? 'round_trip',
      pickup_location: input.pickup_location,
      pickup_time: input.pickup_time ?? null,
      return_location: input.return_location ?? input.pickup_location,
      return_time: input.return_time ?? null,
      vehicle_description: input.vehicle_description ?? null,
      driver_phone: input.driver_phone ?? null,
      notes: input.notes ?? null,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setOffers((prev) => [...prev, optimistic]);
    try {
      const { data, error: insertError } = await supabase
        .from('event_ride_offers')
        .insert({
          event_id: eventId,
          org_id: orgId,
          driver_user_id: user.id,
          seats_offered: input.seats_offered,
          ride_type: input.ride_type ?? 'round_trip',
          pickup_location: input.pickup_location,
          pickup_time: input.pickup_time ?? null,
          return_location: input.return_location ?? input.pickup_location,
          return_time: input.return_time ?? null,
          vehicle_description: input.vehicle_description ?? null,
          driver_phone: input.driver_phone ?? null,
          notes: input.notes ?? null,
        })
        .select()
        .single();
      if (insertError) throw insertError;
      await fetchOffers();
      return { ok: true, offer: data };
    } catch (err) {
      setOffers((prev) => prev.filter((o) => o.id !== tempId));
      return { ok: false, error: err };
    }
  }, [eventId, orgId, user, fetchOffers]);

  // cancelOffer: optimistic status flip, rollback on error.
  const cancelOffer = useCallback(async (offerId, reason = null) => {
    const previous = offers;
    setOffers((prev) => prev.filter((o) => o.id !== offerId));
    try {
      const { error: updateError } = await supabase
        .from('event_ride_offers')
        .update({ status: 'cancelled', cancelled_at: new Date().toISOString(), cancelled_reason: reason })
        .eq('id', offerId);
      if (updateError) throw updateError;
      await fetchOffers();
      return { ok: true };
    } catch (err) {
      setOffers(previous);
      return { ok: false, error: err };
    }
  }, [offers, fetchOffers]);

  return { offers, loading, error, postOffer, cancelOffer, refetch: fetchOffers };
}

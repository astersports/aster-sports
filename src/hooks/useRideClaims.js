// src/hooks/useRideClaims.js
// Phase 1.5 rides rebuild Phase A — rider-side hook.
// Fetches event_ride_claims for an event with Realtime subscription.
// claimSeat + cancelClaim use Migration 032 RPC functions for atomic
// waitlist promotion. Optimistic UI per CLAUDE.md §16.1.

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export function useRideClaims(eventId) {
  const { user } = useAuth();
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchClaims = useCallback(async () => {
    if (!eventId) {
      setClaims([]);
      setLoading(false);
      return;
    }
    setError(null);
    const { data, error: fetchError } = await supabase
      .from('event_ride_claims')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: true });
    if (fetchError) setError(fetchError);
    else setClaims(data || []);
    setLoading(false);
  }, [eventId]);

  useEffect(() => {
    fetchClaims();
  }, [fetchClaims]);

  // Realtime: any change to claims for this event refetches.
  // Critical for waitlist UX: when a confirmed rider cancels, a waitlisted
  // claim is promoted by trigger; this surface picks it up live.
  useEffect(() => {
    if (!eventId) return undefined;
    const channel = supabase
      .channel(`event_ride_claims:${eventId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'event_ride_claims', filter: `event_id=eq.${eventId}` }, fetchClaims)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [eventId, fetchClaims]);

  // claimSeat: optimistic insert, then call atomic RPC. Rollback on error.
  const claimSeat = useCallback(async (input) => {
    if (!user || !eventId || !input.offerId) {
      return { ok: false, error: new Error('Missing user/event/offer context') };
    }
    const tempId = `temp-${Date.now()}`;
    const optimistic = {
      id: tempId,
      offer_id: input.offerId,
      event_id: eventId,
      rider_user_id: user.id,
      for_child_id: input.forChildId ?? null,
      seats_requested: input.seatsRequested ?? 1,
      pickup_address: input.pickupAddress ?? null,
      pickup_notes: input.pickupNotes ?? null,
      return_needed: input.returnNeeded ?? true,
      status: 'pending',
      created_at: new Date().toISOString(),
    };
    setClaims((prev) => [...prev, optimistic]);
    try {
      const { data: claimId, error: rpcError } = await supabase.rpc('claim_ride_offer', {
        p_offer_id: input.offerId,
        p_for_child_id: input.forChildId ?? null,
        p_seats_requested: input.seatsRequested ?? 1,
        p_pickup_address: input.pickupAddress ?? null,
        p_pickup_notes: input.pickupNotes ?? null,
        p_return_needed: input.returnNeeded ?? true,
      });
      if (rpcError) throw rpcError;
      await fetchClaims();
      return { ok: true, claimId };
    } catch (err) {
      setClaims((prev) => prev.filter((c) => c.id !== tempId));
      return { ok: false, error: err };
    }
  }, [eventId, user, fetchClaims]);

  // cancelClaim: optimistic status flip, then atomic RPC. Rollback on error.
  // The RPC handles waitlist promotion server-side.
  const cancelClaim = useCallback(async (claimId) => {
    const previous = claims;
    setClaims((prev) => prev.map((c) => c.id === claimId ? { ...c, status: 'cancelled', cancelled_at: new Date().toISOString() } : c));
    try {
      const { error: rpcError } = await supabase.rpc('cancel_ride_claim', { p_claim_id: claimId, p_cancelled_by: 'rider' });
      if (rpcError) throw rpcError;
      await fetchClaims();
      return { ok: true };
    } catch (err) {
      setClaims(previous);
      return { ok: false, error: err };
    }
  }, [claims, fetchClaims]);

  const confirmClaim = useCallback(async (claimId) => {
    const previous = claims;
    setClaims((prev) => prev.map((c) => c.id === claimId ? { ...c, status: 'confirmed', confirmed_at: new Date().toISOString() } : c));
    const { error } = await supabase.from('event_ride_claims').update({ status: 'confirmed', confirmed_at: new Date().toISOString() }).eq('id', claimId);
    if (error) { setClaims(previous); return { ok: false, error }; }
    return { ok: true };
  }, [claims]);

  const declineClaim = useCallback(async (claimId) => {
    const previous = claims;
    setClaims((prev) => prev.map((c) => c.id === claimId ? { ...c, status: 'declined' } : c));
    const { error } = await supabase.from('event_ride_claims').update({ status: 'declined' }).eq('id', claimId);
    if (error) { setClaims(previous); return { ok: false, error }; }
    return { ok: true };
  }, [claims]);

  return { claims, loading, error, claimSeat, cancelClaim, confirmClaim, declineClaim, refetch: fetchClaims };
}

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/useToast';

export function useRideRequests(eventId) {
  const { user, orgId } = useAuth();
  const { showToast } = useToast();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!eventId || !orgId) { setRequests([]); setLoading(false); return; }
    // Alpha audit defense-in-depth — anti-pattern #37.
    const { data, error } = await supabase.from('event_ride_requests')
      .select('*').eq('org_id', orgId).eq('event_id', eventId).order('created_at', { ascending: true });
    if (error) console.error('useRideRequests:', error.message);
    setRequests(data || []);
    setLoading(false);
  }, [eventId, orgId]);

  useEffect(() => { Promise.resolve().then(fetch); }, [fetch]);

  useEffect(() => {
    if (!eventId) return;
    // L99 TIER 3 PATTERN C: per-instance suffix prevents topic collisions.
    const channel = supabase.channel(`ride_requests:${eventId}:${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'event_ride_requests', filter: `event_id=eq.${eventId}` }, fetch)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [eventId, fetch]);

  const postRequest = useCallback(async (input) => {
    const prev = requests;
    const optimistic = {
      id: `temp-${Date.now()}`, event_id: eventId, org_id: orgId,
      requester_user_id: user.id, for_child_id: input.forChildId ?? null,
      seats_needed: input.seatsNeeded ?? 1, pickup_address: input.pickupAddress ?? null,
      notes: input.notes ?? null, status: 'open', created_at: new Date().toISOString(),
    };
    setRequests((r) => [...r, optimistic]);
    const { error } = await supabase.from('event_ride_requests').insert({
      event_id: eventId, org_id: orgId, requester_user_id: user.id,
      for_child_id: input.forChildId ?? null, seats_needed: input.seatsNeeded ?? 1,
      pickup_address: input.pickupAddress ?? null, notes: input.notes ?? null,
    });
    if (error) {
      setRequests(prev);
      showToast("Looks like that didn't go through. Try again?", 'error');
      return { ok: false };
    }
    await fetch();
    return { ok: true };
  }, [eventId, orgId, user, requests, fetch, showToast]);

  const cancelRequest = useCallback(async (requestId) => {
    const prev = requests;
    setRequests((r) => r.map((req) => req.id === requestId ? { ...req, status: 'cancelled' } : req));
    const { error } = await supabase.from('event_ride_requests')
      .update({ status: 'cancelled' }).eq('id', requestId);
    if (error) {
      setRequests(prev);
      showToast("Looks like that didn't go through. Try again?", 'error');
    }
  }, [requests, showToast]);

  const myOpenRequest = requests.find((r) => r.requester_user_id === user?.id && r.status === 'open');
  const openRequests = requests.filter((r) => r.status === 'open');

  return { requests, openRequests, myOpenRequest, loading, postRequest, cancelRequest };
}

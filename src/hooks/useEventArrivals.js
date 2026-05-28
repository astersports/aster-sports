import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/useToast';

export function useEventArrivals(eventId) {
  const { guardianId } = useAuth();
  const { showToast } = useToast();
  const [arrivals, setArrivals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    if (!eventId) { setLoading(false); return; }
    const { data, error: fetchErr } = await supabase
      .from('event_arrivals')
      .select('id, event_id, player_id, guardian_id, status, eta_minutes, reason, status_changed_at')
      .eq('event_id', eventId);
    if (fetchErr) {
      console.error('useEventArrivals:', fetchErr.message);
      showToast("Couldn't load arrivals. Try again in a moment.", 'error');
      setError(fetchErr);
      setLoading(false);
      return;
    }
    setArrivals(data || []);
    setLoading(false);
  }, [eventId, showToast]);

  useEffect(() => { Promise.resolve().then(fetch); }, [fetch]);

  useEffect(() => {
    if (!eventId) return;
    // Unique per-subscription suffix so two hook instances on the same event
    // (GameDayMode collapsed summary + the expanded ArrivalBoard) don't open
    // two realtime channels with an identical topic name — that collision
    // errors the second subscribe and churns the connection.
    const ch = supabase.channel(`arrivals-${eventId}-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'event_arrivals', filter: `event_id=eq.${eventId}` }, fetch)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [eventId, fetch]);

  const setArrival = useCallback(async (playerId, status, opts = {}) => {
    const row = {
      event_id: eventId, player_id: playerId, guardian_id: guardianId,
      status, eta_minutes: opts.eta || null, reason: opts.reason || null,
      status_changed_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    };
    const existing = arrivals.find((a) => a.player_id === playerId);
    if (existing) {
      const { error } = await supabase.from('event_arrivals').update(row).eq('id', existing.id);
      if (error) { showToast("Couldn't update status. Try again?", 'error'); return; }
    } else {
      const { error } = await supabase.from('event_arrivals').upsert(row, { onConflict: 'event_id,player_id' });
      if (error) { showToast("Couldn't update status. Try again?", 'error'); return; }
    }
    await fetch();
  }, [eventId, guardianId, arrivals, fetch, showToast]);

  const getStatus = (playerId) => arrivals.find((a) => a.player_id === playerId);

  return { arrivals, loading, error, setArrival, getStatus };
}

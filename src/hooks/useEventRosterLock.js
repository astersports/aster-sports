import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/useToast';

// Reads roster lock state from events row; mutations route through the
// SECURITY DEFINER RPCs that handle role gating + log_pii_change audit
// internally (migration 20260509004510). Frontend never writes to
// events.locked_roster_* columns directly.

export function useEventRosterLock(eventId) {
  const { showToast } = useToast();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const cancelledRef = useRef(false);

  const refresh = useCallback(async () => {
    if (!eventId) { setLoading(false); return; }
    const { data, error } = await supabase
      .from('events')
      .select('id, locked_roster_at, locked_roster_by, locked_roster_player_ids, academy_callup_player_ids')
      .eq('id', eventId)
      .single();
    if (cancelledRef.current) return;
    if (error) { showToast("Couldn't load roster lock.", 'error'); setLoading(false); return; }
    setEvent(data);
    setLoading(false);
  }, [eventId, showToast]);

  useEffect(() => {
    cancelledRef.current = false;
    Promise.resolve().then(async () => {
      if (cancelledRef.current) return;
      setLoading(true);
      await refresh();
    });
    return () => { cancelledRef.current = true; };
  }, [refresh]);

  const callRpc = useCallback(async (name, args) => {
    const { error } = await supabase.rpc(name, args);
    if (error) {
      showToast(error.message || "Looks like that didn't go through. Try again?", 'error');
      return false;
    }
    await refresh();
    return true;
  }, [refresh, showToast]);

  const lock = useCallback(
    (playerIds) => callRpc('lock_event_roster', { p_event_id: eventId, p_player_ids: playerIds }),
    [eventId, callRpc],
  );
  const unlock = useCallback(
    (reason) => callRpc('unlock_event_roster', { p_event_id: eventId, p_reason: reason }),
    [eventId, callRpc],
  );
  const addCallup = useCallback(
    (playerId) => callRpc('add_academy_callup', { p_event_id: eventId, p_player_id: playerId }),
    [eventId, callRpc],
  );
  const removeCallup = useCallback(
    (playerId) => callRpc('remove_academy_callup', { p_event_id: eventId, p_player_id: playerId }),
    [eventId, callRpc],
  );

  return {
    isLocked: Boolean(event?.locked_roster_at),
    lockedAt: event?.locked_roster_at || null,
    lockedBy: event?.locked_roster_by || null,
    lockedRosterPlayerIds: event?.locked_roster_player_ids || [],
    academyCallupPlayerIds: event?.academy_callup_player_ids || [],
    loading,
    lock, unlock, addCallup, removeCallup, refresh,
  };
}

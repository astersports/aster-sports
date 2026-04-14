import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

// Fetches check-in rows for an event and exposes a toggle(playerId)
// that upserts true/false on the (event_id, player_id) unique pair.
// Requires a unique constraint on (event_id, player_id) for upsert
// to work — see Supabase schema.
export function useCheckIns(eventId) {
  const [checkIns, setCheckIns] = useState([]);
  const [loading, setLoading] = useState(true);
  const didInitialLoad = useRef(false);

  const fetch = useCallback(async () => {
    if (!eventId) { setLoading(false); return; }
    if (!didInitialLoad.current) setLoading(true);
    const { data, error } = await supabase
      .from('check_ins').select('*').eq('event_id', eventId);
    if (error) console.error('useCheckIns:', error.message);
    setCheckIns(data || []);
    didInitialLoad.current = true;
    setLoading(false);
  }, [eventId]);

  useEffect(() => { fetch(); }, [fetch]);

  const toggle = async (playerId, current) => {
    const next = !current;
    const { error } = await supabase.from('check_ins').upsert(
      { event_id: eventId, player_id: playerId, checked_in: next, checked_in_at: new Date().toISOString() },
      { onConflict: 'event_id,player_id' }
    );
    if (error) { console.error('check_in toggle:', error.message); return; }
    await fetch();
  };

  return { checkIns, loading, toggle, refetch: fetch };
}

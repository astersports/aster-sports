import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/useToast';

export function useCheckIns(eventId) {
  const { showToast } = useToast();
  const [checkIns, setCheckIns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const didInitialLoad = useRef(false);
  const cancelledRef = useRef(false);

  const fetch = useCallback(async () => {
    if (!eventId) { setLoading(false); return; }
    if (!didInitialLoad.current) setLoading(true);
    const { data, error: fetchErr } = await supabase
      .from('check_ins').select('*').eq('event_id', eventId);
    if (cancelledRef.current) return;
    if (fetchErr) {
      console.error('useCheckIns:', fetchErr.message);
      setError(fetchErr);
      setLoading(false);
      return;
    }
    setCheckIns(data || []);
    didInitialLoad.current = true;
    setLoading(false);
  }, [eventId]);

  useEffect(() => { cancelledRef.current = false; Promise.resolve().then(fetch); return () => { cancelledRef.current = true; }; }, [fetch]);

  const toggle = async (playerId, current) => {
    const next = !current;
    const { error } = await supabase.from('check_ins').upsert(
      { event_id: eventId, player_id: playerId, checked_in: next, checked_in_at: new Date().toISOString() },
      { onConflict: 'event_id,player_id' }
    );
    if (error) {
      console.error('check_in toggle:', error.message);
      showToast('Could not update attendance. Try again.', 'error');
      return false;
    }
    await fetch();
    return true;
  };

  return { checkIns, loading, error, toggle, refetch: fetch };
}

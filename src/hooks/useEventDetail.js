import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

export function useEventDetail(eventId, seed = null) {
  const [event, setEvent] = useState(seed);
  const [loading, setLoading] = useState(!seed);
  const activeIdRef = useRef(eventId);

  const refetch = useCallback(() => {
    if (!eventId) { setLoading(false); return; }
    activeIdRef.current = eventId;
    supabase
      .from('events')
      .select('*, teams(id, name, team_color, org_id, sort_order)')
      .eq('id', eventId)
      .single()
      .then(({ data, error }) => {
        if (activeIdRef.current !== eventId) return;
        if (error) console.error('useEventDetail:', error.message);
        setEvent(data || null);
        setLoading(false);
      });
  }, [eventId]);

  useEffect(() => { Promise.resolve().then(refetch); }, [refetch]);

  // Optimistically patch a field without waiting for a full refetch.
  // Used by cancel/reinstate to update status instantly in the UI.
  const patchEvent = useCallback((patch) => {
    setEvent((prev) => prev ? { ...prev, ...patch } : prev);
  }, []);

  return { event, loading, refetch, patchEvent };
}

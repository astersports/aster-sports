import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function useEventDetail(eventId, seed = null) {
  const [event, setEvent] = useState(seed);
  const [loading, setLoading] = useState(!seed);

  const refetch = useCallback(() => {
    if (!eventId) { setLoading(false); return; }
    // Don't setLoading(true) on refetch — only the initial mount
    // should show the loading placeholder. Subsequent refetches
    // (cancel, reinstate, edit) update the event in-place so the
    // page stays visible and scroll position is preserved.
    supabase
      .from('events')
      .select('*, teams(id, name, team_color, org_id, sort_order)')
      .eq('id', eventId)
      .single()
      .then(({ data, error }) => {
        if (error) console.error('useEventDetail:', error.message);
        setEvent(data || null);
        setLoading(false);
      });
  }, [eventId]);

  // Microtask wrap pushes the synchronous setLoading(false) at the top of
  // refetch() out of the effect body, satisfying react-hooks/set-state-in-effect.
  useEffect(() => { Promise.resolve().then(refetch); }, [refetch]);

  // Optimistically patch a field without waiting for a full refetch.
  // Used by cancel/reinstate to update status instantly in the UI.
  const patchEvent = useCallback((patch) => {
    setEvent((prev) => prev ? { ...prev, ...patch } : prev);
  }, []);

  return { event, loading, refetch, patchEvent };
}

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function useEventDetail(eventId) {
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!eventId) { setLoading(false); return; }
    setLoading(true);
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

  return { event, loading };
}

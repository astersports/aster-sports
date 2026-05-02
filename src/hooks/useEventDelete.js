import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/useToast';

export default function useEventDelete(event) {
  const navigate = useNavigate();
  const { showToast } = useToast();

  return useCallback(async () => {
    try {
      if (event?.parent_event_id) {
        if (window.confirm('Delete ALL future events in this series?\n\nOK = delete all future\nCancel = delete only this one')) {
          const { error: serErr } = await supabase.from('events').delete()
            .eq('parent_event_id', event.parent_event_id)
            .gte('start_at', event.start_at);
          if (serErr) throw serErr;
          await supabase.from('events').delete().eq('id', event.id);
        } else {
          if (!window.confirm('Delete just this one event?')) return;
          const { error } = await supabase.from('events').delete().eq('id', event.id);
          if (error) throw error;
        }
      } else {
        if (!window.confirm('Delete this event?')) return;
        const { error } = await supabase.from('events').delete().eq('id', event.id);
        if (error) throw error;
      }
      navigate('/schedule');
    } catch (err) {
      showToast(`Delete failed: ${err.message}`, 'error');
    }
  }, [event?.id, event?.parent_event_id, event?.start_at, navigate, showToast]);
}

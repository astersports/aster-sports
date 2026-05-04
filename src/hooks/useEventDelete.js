import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/useToast';

export default function useEventDelete(event) {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [pendingDelete, setPendingDelete] = useState(null);

  const requestDelete = useCallback(() => {
    if (event?.parent_event_id) {
      setPendingDelete({ type: 'series' });
    } else {
      setPendingDelete({ type: 'single' });
    }
  }, [event?.parent_event_id]);

  const confirmDelete = useCallback(async (choice) => {
    setPendingDelete(null);
    try {
      if (choice === 'allFuture') {
        const { error: serErr } = await supabase.from('events').delete()
          .eq('parent_event_id', event.parent_event_id)
          .gte('start_at', event.start_at);
        if (serErr) throw serErr;
        await supabase.from('events').delete().eq('id', event.id);
      } else {
        const { error } = await supabase.from('events').delete().eq('id', event.id);
        if (error) throw error;
      }
      navigate('/schedule');
    } catch (err) {
      const msg = err.message?.includes('foreign key') || err.message?.includes('violates')
        ? 'This event has scores or data attached. Remove them first, then delete.'
        : `Delete failed: ${err.message}`;
      showToast(msg, 'error');
    }
  }, [event?.id, event?.parent_event_id, event?.start_at, navigate, showToast]);

  const cancelDelete = useCallback(() => setPendingDelete(null), []);

  return { requestDelete, pendingDelete, confirmDelete, cancelDelete };
}

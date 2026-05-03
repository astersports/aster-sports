import { Ban } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import Button from '../shared/Button';

export default function EventCancelActions({ event, onStatusChange }) {
  const doCancel = async () => {
    const ok = window.confirm('Cancel this event? It will stay on the schedule as cancelled.');
    if (!ok) return;
    const { error } = await supabase.from('events').update({ status: 'cancelled' }).eq('id', event.id);
    if (error) { window.alert(`Cancel failed: ${error.message}`); return; }
    onStatusChange?.('cancelled');
  };

  const doReinstate = async () => {
    const { error } = await supabase.from('events').update({ status: 'scheduled' }).eq('id', event.id);
    if (error) { window.alert(`Reinstate failed: ${error.message}`); return; }
    onStatusChange?.('scheduled');
  };

  return (
    <div style={{ padding: '16px' }}>
      {event.status !== 'cancelled' && (
        <Button variant="secondary" fullWidth onClick={doCancel} style={{ borderColor: 'var(--em-warning)', color: 'var(--em-warning)' }}>
          <Ban size={16} strokeWidth={1.75} /> Cancel Event
        </Button>
      )}
      {event.status === 'cancelled' && (
        <Button variant="secondary" fullWidth onClick={doReinstate}>
          Reinstate Event
        </Button>
      )}
    </div>
  );
}

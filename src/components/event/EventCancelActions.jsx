import { useState } from 'react';
import { Ban } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import Button from '../shared/Button';
import ConfirmDialog from '../shared/ConfirmDialog';
import { useToast } from '../../context/useToast';

export default function EventCancelActions({ event, onStatusChange }) {
  const [confirmAction, setConfirmAction] = useState(null);
  const { showToast } = useToast();

  const doCancel = async () => {
    setConfirmAction(null);
    const { error } = await supabase.from('events').update({ status: 'cancelled' }).eq('id', event.id);
    if (error) { showToast(`Cancel failed: ${error.message}`, 'error'); return; }
    onStatusChange?.('cancelled');
  };

  const doReinstate = async () => {
    const { error } = await supabase.from('events').update({ status: 'scheduled' }).eq('id', event.id);
    if (error) { showToast(`Reinstate failed: ${error.message}`, 'error'); return; }
    onStatusChange?.('scheduled');
  };

  return (
    <div style={{ padding: '16px' }}>
      {event.status !== 'cancelled' && (
        <Button variant="secondary" fullWidth onClick={() => setConfirmAction({ type: 'cancel' })} style={{ borderColor: 'var(--em-warning)', color: 'var(--em-warning)' }}>
          <Ban size={16} strokeWidth={1.75} /> Cancel Event
        </Button>
      )}
      {event.status === 'cancelled' && (
        <Button variant="secondary" fullWidth onClick={doReinstate}>
          Reinstate Event
        </Button>
      )}
      {confirmAction?.type === 'cancel' && (
        <ConfirmDialog title="Cancel Event" message="Cancel this event? It will stay on the schedule as cancelled." confirmLabel="Cancel Event" destructive onConfirm={doCancel} onCancel={() => setConfirmAction(null)} />
      )}
    </div>
  );
}

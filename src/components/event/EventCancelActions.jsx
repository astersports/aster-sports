import { Ban } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function EventCancelActions({ event, onRefresh }) {
  const doCancel = async () => {
    const ok = window.confirm('Cancel this event? It will stay on the schedule as cancelled.');
    if (!ok) return;
    const { error } = await supabase.from('events').update({ status: 'cancelled' }).eq('id', event.id);
    if (error) { window.alert(`Cancel failed: ${error.message}`); return; }
    onRefresh?.();
  };

  const doReinstate = async () => {
    const { error } = await supabase.from('events').update({ status: 'scheduled' }).eq('id', event.id);
    if (error) { window.alert(`Reinstate failed: ${error.message}`); return; }
    onRefresh?.();
  };

  return (
    <div style={{ padding: '16px' }}>
      {event.status !== 'cancelled' && (
        <button type="button" onClick={doCancel} className="sf-press"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            width: '100%', minHeight: 44, borderRadius: 10,
            border: '1px solid var(--sf-warning)', backgroundColor: 'transparent',
            color: 'var(--sf-warning)', fontSize: 14, fontWeight: 500,
          }}>
          <Ban size={16} strokeWidth={1.75} />
          Cancel Event
        </button>
      )}
      {event.status === 'cancelled' && (
        <button type="button" onClick={doReinstate} className="sf-press"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            width: '100%', minHeight: 44, borderRadius: 10,
            border: '1px solid var(--sf-accent)', backgroundColor: 'transparent',
            color: 'var(--sf-accent)', fontSize: 14, fontWeight: 500,
          }}>
          Reinstate Event
        </button>
      )}
    </div>
  );
}

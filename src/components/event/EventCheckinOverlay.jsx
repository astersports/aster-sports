import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft } from 'lucide-react';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import EventCheckinTab from './EventCheckinTab';

const iconBtn = { minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' };

export default function EventCheckinOverlay({ eventId, roster, teamColor, onClose }) {
  const trapRef = useFocusTrap(true);
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return createPortal(
    <div ref={trapRef} role="dialog" aria-modal="true" aria-label="Take Attendance"
      style={{ position: 'fixed', inset: 0, backgroundColor: 'var(--as-bg-page)', zIndex: 9999, display: 'flex', flexDirection: 'column', paddingTop: 'env(safe-area-inset-top, 0px)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 4px', borderBottom: '1px solid var(--as-border-default)', backgroundColor: 'var(--as-bg-card)' }}>
        <button type="button" onClick={onClose} className="as-press" aria-label="Close attendance" style={iconBtn}>
          <ArrowLeft size={20} strokeWidth={1.75} color="var(--as-text-primary)" />
        </button>
        <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--as-text-primary)' }}>Take Attendance</h2>
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <EventCheckinTab eventId={eventId} roster={roster} teamColor={teamColor} />
      </div>
    </div>,
    document.body,
  );
}

import { createPortal } from 'react-dom';
import { ArrowLeft } from 'lucide-react';
import EventCheckinTab from './EventCheckinTab';

const iconBtn = { minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' };

export default function EventCheckinOverlay({ eventId, roster, teamColor, onClose }) {
  return createPortal(
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'var(--em-bg-page)', zIndex: 9999, display: 'flex', flexDirection: 'column', paddingTop: 'env(safe-area-inset-top, 0px)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 4px', borderBottom: '1px solid var(--em-border-default)', backgroundColor: 'var(--em-bg-card)' }}>
        <button type="button" onClick={onClose} className="sf-press" style={iconBtn}>
          <ArrowLeft size={20} strokeWidth={1.75} color="var(--em-text-primary)" />
        </button>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--em-text-primary)' }}>Take Attendance</h2>
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <EventCheckinTab eventId={eventId} roster={roster} teamColor={teamColor} />
      </div>
    </div>,
    document.body,
  );
}

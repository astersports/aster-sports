import { createPortal } from 'react-dom';
import { ArrowLeft } from 'lucide-react';

const labelStyle = { fontSize: 13, fontWeight: 500, color: 'var(--sf-text-secondary)', marginBottom: 2, display: 'block' };
const inputStyle = { minHeight: 40, borderRadius: 10, border: '1px solid var(--sf-border-default)', backgroundColor: 'var(--sf-bg-card)', padding: '0 10px', fontSize: 14, color: 'var(--sf-text-primary)' };

export default function RideFormOverlay({ form, draft, setDraft, onClose, onSubmit, eventLocation, eventEndAt, phoneKnown }) {
  const estReturn = eventEndAt
    ? new Date(new Date(eventEndAt).getTime() + 15 * 60000).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    : 'TBD';

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'var(--sf-bg-page)', zIndex: 9999, display: 'flex', flexDirection: 'column', paddingTop: 'env(safe-area-inset-top, 0px)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 4px', borderBottom: '1px solid var(--sf-border-default)', backgroundColor: 'var(--sf-bg-card)' }}>
        <button type="button" onClick={onClose} className="sf-press" style={{ minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ArrowLeft size={20} strokeWidth={1.75} color="var(--sf-text-primary)" />
        </button>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--sf-text-primary)' }}>
          {form === 'offering' ? 'Offer a ride' : 'Request a ride'}
        </h2>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {!phoneKnown && (
          <div>
            <label style={labelStyle}>Phone (required)</label>
            <input type="tel" placeholder="(914) 555-1234" value={draft.phone} required
              onChange={(e) => setDraft({ ...draft, phone: e.target.value })} style={{ ...inputStyle, width: '100%' }} />
          </div>
        )}
        <div>
          <label style={labelStyle}>Pickup address</label>
          <input type="text" placeholder="4 Byram Brook Place, Armonk" value={draft.pickup_location}
            onChange={(e) => setDraft({ ...draft, pickup_location: e.target.value })} style={{ ...inputStyle, width: '100%' }} />
        </div>
        <div>
          <label style={labelStyle}>Departure time</label>
          <input type="time" value={draft.departure_time}
            onChange={(e) => setDraft({ ...draft, departure_time: e.target.value })} style={{ ...inputStyle, width: '100%' }} />
        </div>
        <div style={{ fontSize: 13, color: 'var(--sf-text-tertiary)' }}>
          Drop-off: {eventLocation || 'TBD'} · Est. return: {estReturn}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 14, color: 'var(--sf-text-secondary)' }}>
            {form === 'offering' ? 'Seats available' : 'Riders'}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button type="button" onClick={() => setDraft({ ...draft, seats: Math.max(1, draft.seats - 1) })}
              disabled={draft.seats <= 1}
              style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid var(--sf-border-default)', backgroundColor: 'var(--sf-bg-card)', fontSize: 16 }}>
              -
            </button>
            <span style={{ minWidth: 24, textAlign: 'center', fontSize: 15, fontWeight: 600 }}>{draft.seats}</span>
            <button type="button" onClick={() => setDraft({ ...draft, seats: Math.min(8, draft.seats + 1) })}
              style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid var(--sf-border-default)', backgroundColor: 'var(--sf-bg-card)', fontSize: 16 }}>
              +
            </button>
          </div>
        </div>
        <div>
          <label style={labelStyle}>Notes</label>
          <input type="text" placeholder="Will text when leaving and when we arrive" value={draft.notes || ''}
            onChange={(e) => setDraft({ ...draft, notes: e.target.value })} style={{ ...inputStyle, width: '100%' }} />
        </div>
      </div>
      <div style={{ padding: 16, borderTop: '1px solid var(--sf-border-default)' }}>
        <button type="button" onClick={onSubmit} className="sf-press"
          style={{ width: '100%', minHeight: 48, borderRadius: 10, border: 'none', backgroundColor: 'var(--sf-accent)', color: 'var(--sf-text-inverse)', fontSize: 16, fontWeight: 600 }}>
          {form === 'offering' ? 'Offer ride' : 'Request ride'}
        </button>
      </div>
    </div>,
    document.body,
  );
}

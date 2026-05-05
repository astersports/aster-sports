import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../shared/Button';
import Input from '../shared/Input';

export default function RequestRideForm({ open, onClose, onSubmit, eventTeamId }) {
  const { myChildren } = useAuth();
  const kids = (myChildren || []).filter((c) => c.teamIds?.includes(eventTeamId) || c.teamId === eventTeamId);
  const [seatsNeeded, setSeatsNeeded] = useState('1');
  const [pickupAddress, setPickupAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [forChildId, setForChildId] = useState(kids.length === 1 ? kids[0].playerId : '');
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    await onSubmit({ forChildId: forChildId || null, seatsNeeded: parseInt(seatsNeeded) || 1, pickupAddress: pickupAddress.trim() || null, notes: notes.trim() || null });
    setSubmitting(false);
    onClose();
  };

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, backgroundColor: 'var(--em-bg-page)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--em-border-default)' }}>
        <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--em-accent)', fontSize: 15, cursor: 'pointer' }}>Cancel</button>
        <span style={{ fontSize: 17, fontWeight: 600, color: 'var(--em-text-primary)' }}>Request a ride</span>
        <div style={{ width: 44 }} />
      </div>
      <form id="request-ride-form" onSubmit={handleSubmit} style={{ flex: 1, overflow: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {kids.length > 1 && (
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--em-text-secondary)', marginBottom: 4, display: 'block' }}>Which child?</label>
            <select value={forChildId} onChange={(e) => setForChildId(e.target.value)} style={{ width: '100%', minHeight: 44, padding: '0 12px', borderRadius: 10, border: '1.5px solid var(--em-border-default)', backgroundColor: 'var(--em-bg-tertiary)', color: 'var(--em-text-primary)', fontSize: 15, fontFamily: 'inherit' }}>
              <option value="">Select child</option>
              {kids.map((k) => <option key={k.playerId} value={k.playerId}>{k.firstName}</option>)}
            </select>
          </div>
        )}
        <Input label="Seats needed" type="number" inputMode="numeric" min="1" max="6" value={seatsNeeded} onChange={(e) => setSeatsNeeded(e.target.value)} />
        <Input label="Pickup address (optional)" placeholder="123 Main St or 'meet at gym'" value={pickupAddress} onChange={(e) => setPickupAddress(e.target.value)} />
        <Input label="Notes for driver (optional)" placeholder="Car seat needed, allergies, etc." value={notes} onChange={(e) => setNotes(e.target.value)} />
      </form>
      <div style={{ padding: 16, borderTop: '1px solid var(--em-border-default)' }}>
        <Button fullWidth type="submit" form="request-ride-form" disabled={submitting}>
          {submitting ? 'Posting...' : 'Post request'}
        </Button>
      </div>
    </div>,
    document.body
  );
}

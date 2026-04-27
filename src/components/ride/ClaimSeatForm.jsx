// src/components/ride/ClaimSeatForm.jsx
// Phase 1.5 rides Phase C — rider form to claim a seat on an existing offer.
// Q3 lock: child auto-fill if 1 kid, picker if 2+.
// Q4 lock: return_needed inherited from offer.ride_type, no toggle.

import { useState, useCallback, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import FullScreenForm from '../shared/FullScreenForm';

const labelStyle = { fontSize: 12, fontWeight: 600, color: 'var(--em-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4, display: 'block' };
const inputStyle = { width: '100%', minHeight: 44, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--em-border-default)', backgroundColor: 'var(--em-bg-card)', color: 'var(--em-text-primary)', fontSize: 14, fontFamily: 'inherit' };

export default function ClaimSeatForm({ open, onClose, offer, onSubmit }) {
  const { myChildren = [] } = useAuth();
  const eligibleKids = useMemo(() => {
    const all = myChildren ?? [];
    if (!offer?.team_id) return all;
    return all.filter((k) => k.teamId === offer.team_id);
  }, [myChildren, offer]);

  const [forChildId, setForChildId] = useState('');
  const [seatsRequested, setSeatsRequested] = useState('1');
  const [pickupAddress, setPickupAddress] = useState('');
  const [pickupNotes, setPickupNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const reset = useCallback(() => {
    setForChildId('');
    setSeatsRequested('1'); setPickupAddress(''); setPickupNotes(''); setSubmitting(false); setError(null);
  }, []);

  const handleClose = useCallback(() => { reset(); onClose?.(); }, [reset, onClose]);

  // Q4 lock: round-trip behavior inherited from offer's ride_type.
  const returnNeeded = offer?.ride_type !== 'arrival_only';

  const handleSubmit = useCallback(async (e) => {
    e?.preventDefault();
    const seatsNum = Number(seatsRequested);
    if (!seatsNum || seatsNum < 1) { setError('At least 1 seat is required.'); return; }
    if (eligibleKids.length > 1 && !forChildId) { setError('Choose which child this ride is for.'); return; }
    setSubmitting(true);
    setError(null);
    const effectiveChildId = forChildId || (eligibleKids.length === 1 ? eligibleKids[0].playerId : null);
    const result = await onSubmit?.({
      offerId: offer.id,
      forChildId: effectiveChildId,
      seatsRequested: seatsNum,
      pickupAddress: pickupAddress.trim() || null,
      pickupNotes: pickupNotes.trim() || null,
      returnNeeded,
    });
    setSubmitting(false);
    if (result?.ok) handleClose();
    else setError(result?.error?.message || "Looks like that didn't go through. Try again?");
  }, [offer, forChildId, seatsRequested, pickupAddress, pickupNotes, returnNeeded, eligibleKids, onSubmit, handleClose]);

  if (!offer) return null;

  return (
    <FullScreenForm
      open={open}
      onClose={handleClose}
      title="Claim a seat"
      footer={
        <button type="submit" form="claim-seat-form" disabled={submitting} className="sf-press" style={{ minHeight: 44, padding: '0 20px', borderRadius: 8, border: 'none', backgroundColor: submitting ? 'var(--em-bg-secondary)' : 'var(--em-accent)', color: submitting ? 'var(--em-text-tertiary)' : 'white', fontSize: 14, fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
          {submitting ? 'Claiming…' : 'Claim seat'}
        </button>
      }
    >
      <form id="claim-seat-form" onSubmit={handleSubmit} style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {error && <div role="alert" style={{ padding: 10, borderRadius: 8, backgroundColor: 'color-mix(in srgb, var(--em-danger) 10%, transparent)', color: 'var(--em-danger)', fontSize: 13 }}>{error}</div>}
        <div style={{ padding: 12, borderRadius: 8, backgroundColor: 'var(--em-bg-secondary)', fontSize: 13, color: 'var(--em-text-secondary)' }}>
          {offer.ride_type === 'arrival_only' ? 'This is an arrival-only ride. You will need a separate ride home.' : offer.ride_type === 'return_only' ? 'This is a return-only ride from the venue.' : 'Round trip — pickup and return seats included.'}
        </div>
        {eligibleKids.length > 1 && (
          <div>
            <label style={labelStyle} htmlFor="forChild">Which child?</label>
            <select id="forChild" value={forChildId} onChange={(e) => setForChildId(e.target.value)} required style={inputStyle} autoFocus>
              <option value="">Choose a child…</option>
              {eligibleKids.map((k) => (<option key={k.playerId} value={k.playerId}>{k.firstName}</option>))}
            </select>
          </div>
        )}
        <div>
          <label style={labelStyle} htmlFor="seatsRequested">Seats needed</label>
          <input id="seatsRequested" type="number" min="1" max={offer.seats_offered || 1} value={seatsRequested} onChange={(e) => setSeatsRequested(e.target.value)} required style={inputStyle} autoFocus={eligibleKids.length <= 1} />
        </div>
        <div>
          <label style={labelStyle} htmlFor="pickupAddress">Pickup address (optional)</label>
          <input id="pickupAddress" type="text" value={pickupAddress} onChange={(e) => setPickupAddress(e.target.value)} placeholder="e.g., 12 Main St, Armonk" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle} htmlFor="pickupNotes">Pickup notes (optional)</label>
          <textarea id="pickupNotes" value={pickupNotes} onChange={(e) => setPickupNotes(e.target.value)} rows="2" placeholder="e.g., gate code 1234, ring buzzer" style={{ ...inputStyle, minHeight: 64, padding: '10px 12px' }} />
        </div>
      </form>
    </FullScreenForm>
  );
}

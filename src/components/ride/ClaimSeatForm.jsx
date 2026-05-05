// src/components/ride/ClaimSeatForm.jsx
// Phase 1.5 rides Phase C — rider form to claim a seat on an existing offer.
// Q3 lock: child auto-fill if 1 kid, picker if 2+.
// Q4 lock: return_needed inherited from offer.ride_type, no toggle.

import { useState, useCallback, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import FullScreenForm from '../shared/FullScreenForm';
import Input from '../shared/Input';
import Button from '../shared/Button';

const labelStyle = { fontSize: 13, fontWeight: 600, color: 'var(--em-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4, display: 'block' };
const selectStyle = { width: '100%', minHeight: 44, padding: '0 14px', borderRadius: 10, border: '1.5px solid var(--em-border-default)', backgroundColor: 'var(--em-bg-tertiary)', color: 'var(--em-text-primary)', fontSize: 15, fontFamily: 'inherit' };

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
        <Button type="submit" form="claim-seat-form" disabled={submitting}>
          {submitting ? 'Claiming…' : 'Claim seat'}
        </Button>
      }
    >
      <form id="claim-seat-form" onSubmit={handleSubmit} style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {error && <div role="alert" style={{ padding: 10, borderRadius: 8, backgroundColor: 'var(--em-danger-soft)', color: 'var(--em-danger)', fontSize: 13 }}>{error}</div>}
        <div style={{ padding: 12, borderRadius: 8, backgroundColor: 'var(--em-bg-secondary)', fontSize: 13, color: 'var(--em-text-secondary)' }}>
          {offer.ride_type === 'arrival_only' ? 'This is an arrival-only ride. You will need a separate ride home.' : offer.ride_type === 'return_only' ? 'This is a return-only ride from the venue.' : 'Round trip — pickup and return seats included.'}
        </div>
        {eligibleKids.length > 1 && (
          <div>
            <label style={labelStyle} htmlFor="forChild">Which child?</label>
            <select id="forChild" value={forChildId} onChange={(e) => setForChildId(e.target.value)} required style={selectStyle} autoFocus>
              <option value="">Choose a child…</option>
              {eligibleKids.map((k) => (<option key={k.playerId} value={k.playerId}>{k.firstName}</option>))}
            </select>
          </div>
        )}
        <Input label="Seats needed" id="seatsRequested" type="number" inputMode="numeric" min="1" max={offer.seats_offered || 1} value={seatsRequested} onChange={(e) => setSeatsRequested(e.target.value)} required autoFocus={eligibleKids.length <= 1} />
        <div>
          <Input label="Need door-to-door pickup? (optional)" id="pickupAddress" type="text" value={pickupAddress} onChange={(e) => setPickupAddress(e.target.value)} placeholder="Your address, if you need pickup at home" />
          <div style={{ fontSize: 13, color: 'var(--em-text-tertiary)', marginTop: 4 }}>Most riders meet at the offer's pickup spot. Only fill this in if you've worked out a home pickup with the driver.</div>
        </div>
        <div>
          <label style={labelStyle} htmlFor="pickupNotes">Anything the driver should know? (optional)</label>
          <textarea id="pickupNotes" value={pickupNotes} onChange={(e) => setPickupNotes(e.target.value)} rows="2" placeholder="e.g., car seat needed, will text on arrival" style={{ width: '100%', minHeight: 64, padding: '10px 12px', borderRadius: 10, border: '1.5px solid var(--em-border-default)', backgroundColor: 'var(--em-bg-tertiary)', color: 'var(--em-text-primary)', fontSize: 15, fontFamily: 'inherit' }} />
        </div>
      </form>
    </FullScreenForm>
  );
}

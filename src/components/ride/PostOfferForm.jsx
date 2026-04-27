// src/components/ride/PostOfferForm.jsx
// Phase 1.5 rides Phase C — driver form to post a new ride offer.
// Uses FullScreenForm primitive: Cancel button in header (iOS HIG),
// Submit button in footer. Optimistic UI happens in the hook.

import { useState, useCallback } from 'react';
import FullScreenForm from '../shared/FullScreenForm';

const labelStyle = { fontSize: 12, fontWeight: 600, color: 'var(--em-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4, display: 'block' };
const inputStyle = { width: '100%', minHeight: 44, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--em-border-default)', backgroundColor: 'var(--em-bg-card)', color: 'var(--em-text-primary)', fontSize: 14, fontFamily: 'inherit' };

export default function PostOfferForm({ open, onClose, onSubmit }) {
  const [seats, setSeats] = useState('2');
  const [rideType, setRideType] = useState('round_trip');
  const [pickupLocation, setPickupLocation] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [returnLocation, setReturnLocation] = useState('');
  const [returnTime, setReturnTime] = useState('');
  const [vehicle, setVehicle] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const reset = useCallback(() => {
    setSeats('2'); setRideType('round_trip'); setPickupLocation(''); setPickupTime('');
    setReturnLocation(''); setReturnTime(''); setVehicle(''); setPhone(''); setNotes('');
    setSubmitting(false); setError(null);
  }, []);

  const handleClose = useCallback(() => { reset(); onClose?.(); }, [reset, onClose]);

  const handleSubmit = useCallback(async (e) => {
    e?.preventDefault();
    if (!pickupLocation.trim()) { setError('Pickup location is required.'); return; }
    const seatsNum = Number(seats);
    if (!seatsNum || seatsNum < 1 || seatsNum > 12) { setError('Seats must be between 1 and 12.'); return; }
    setSubmitting(true);
    setError(null);
    const result = await onSubmit?.({
      seats_offered: seatsNum,
      ride_type: rideType,
      pickup_location: pickupLocation.trim(),
      pickup_time: pickupTime ? new Date(pickupTime).toISOString() : null,
      return_location: (returnLocation.trim() || pickupLocation.trim()),
      return_time: returnTime ? new Date(returnTime).toISOString() : null,
      vehicle_description: vehicle.trim() || null,
      driver_phone: phone.trim() || null,
      notes: notes.trim() || null,
    });
    setSubmitting(false);
    if (result?.ok) handleClose();
    else setError(result?.error?.message || "Looks like that didn't go through. Try again?");
  }, [seats, rideType, pickupLocation, pickupTime, returnLocation, returnTime, vehicle, phone, notes, onSubmit, handleClose]);

  return (
    <FullScreenForm
      open={open}
      onClose={handleClose}
      title="Offer a ride"
      footer={
        <button type="submit" form="post-offer-form" disabled={submitting} className="sf-press" style={{ minHeight: 44, padding: '0 20px', borderRadius: 8, border: 'none', backgroundColor: submitting ? 'var(--em-bg-secondary)' : 'var(--em-accent)', color: submitting ? 'var(--em-text-tertiary)' : 'white', fontSize: 14, fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
          {submitting ? 'Posting…' : 'Post offer'}
        </button>
      }
    >
      <form id="post-offer-form" onSubmit={handleSubmit} style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {error && <div role="alert" style={{ padding: 10, borderRadius: 8, backgroundColor: 'color-mix(in srgb, var(--em-danger) 10%, transparent)', color: 'var(--em-danger)', fontSize: 13 }}>{error}</div>}
        <div><label style={labelStyle} htmlFor="seats">Seats available</label><input id="seats" type="number" min="1" max="12" value={seats} onChange={(e) => setSeats(e.target.value)} required style={inputStyle} /></div>
        <div><label style={labelStyle} htmlFor="rideType">Trip type</label>
          <select id="rideType" value={rideType} onChange={(e) => setRideType(e.target.value)} style={inputStyle}>
            <option value="round_trip">Round trip</option>
            <option value="arrival_only">Arrival only</option>
            <option value="return_only">Return only</option>
          </select>
        </div>
        <div><label style={labelStyle} htmlFor="pickup">Pickup from</label><input id="pickup" type="text" value={pickupLocation} onChange={(e) => setPickupLocation(e.target.value)} placeholder="e.g., Armonk Town Center" required autoFocus style={inputStyle} /></div>
        <div><label style={labelStyle} htmlFor="pickupTime">Pickup time (optional)</label><input id="pickupTime" type="datetime-local" value={pickupTime} onChange={(e) => setPickupTime(e.target.value)} style={inputStyle} /></div>
        {rideType === 'round_trip' && (<>
          <div><label style={labelStyle} htmlFor="returnLoc">Return to (optional)</label><input id="returnLoc" type="text" value={returnLocation} onChange={(e) => setReturnLocation(e.target.value)} placeholder="Defaults to pickup location" style={inputStyle} /></div>
          <div><label style={labelStyle} htmlFor="returnTime">Return time (optional)</label><input id="returnTime" type="datetime-local" value={returnTime} onChange={(e) => setReturnTime(e.target.value)} style={inputStyle} /></div>
        </>)}
        <div><label style={labelStyle} htmlFor="vehicle">Vehicle (optional)</label><input id="vehicle" type="text" value={vehicle} onChange={(e) => setVehicle(e.target.value)} placeholder="e.g., Black Tesla Model Y" style={inputStyle} /></div>
        <div><label style={labelStyle} htmlFor="phone">Phone (optional, shown to confirmed riders only)</label><input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(914) 555-1234" style={inputStyle} /></div>
        <div><label style={labelStyle} htmlFor="notes">Notes (optional)</label><textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows="3" placeholder="e.g., Will swing by Bedford on the way" style={{ ...inputStyle, minHeight: 80, padding: '10px 12px' }} /></div>
      </form>
    </FullScreenForm>
  );
}

// src/components/ride/PostOfferForm.jsx
// Phase 1.5 rides Phase C — driver form to post a new ride offer.
// Uses FullScreenForm primitive: Cancel button in header (iOS HIG),
// Submit button in footer. Optimistic UI happens in the hook.

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import FullScreenForm from '../shared/FullScreenForm';
import Input from '../shared/Input';
import Button from '../shared/Button';

const labelStyle = { fontSize: 13, fontWeight: 600, color: 'var(--em-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4, display: 'block' };
const selectStyle = { width: '100%', minHeight: 44, padding: '0 14px', borderRadius: 10, border: '1.5px solid var(--em-border-default)', backgroundColor: 'var(--em-bg-tertiary)', color: 'var(--em-text-primary)', fontSize: 15, fontFamily: 'inherit' };

const pad = (n) => String(n).padStart(2, '0');
const isoToLocal = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const isoMinusMinutes = (iso, mins) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  d.setMinutes(d.getMinutes() - mins);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export default function PostOfferForm({ open, onClose, onSubmit, eventStartAt = null, eventEndAt = null, hasActiveOffer = false }) {
  const [seats, setSeats] = useState('2');
  const [rideType, setRideType] = useState('round_trip');
  const [pickupLocation, setPickupLocation] = useState('');
  // pickupTime / returnTime use the derived-with-override pattern:
  // state holds the user's edit (or null if untouched); the consumed
  // value is the override when set, else the eventStartAt/EndAt-derived
  // default. Replaces an effect that initialized defaults on the open
  // toggle. !== null discrimination (not truthy) so '' is a valid
  // user override (cleared field).
  const [pickupTimeOverride, setPickupTime] = useState(null);
  const [returnLocation, setReturnLocation] = useState('');
  const [returnTimeOverride, setReturnTime] = useState(null);
  const [vehicle, setVehicle] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const { user, orgId } = useAuth();

  // Auto-populate phone from current user's guardian record, fall back to coaching_assignments.
  useEffect(() => {
    if (!open || !user?.id || !orgId || phone) return undefined;
    let cancelled = false;
    (async () => {
      const { data: g, error: gErr } = await supabase.from('guardians').select('phone').eq('org_id', orgId).eq('user_id', user.id).maybeSingle();
      if (gErr) throw gErr;
      if (cancelled) return;
      if (g?.phone) { setPhone(g.phone); return; }
      const { data: c, error: cErr } = await supabase.from('coaching_assignments').select('phone').eq('org_id', orgId).eq('user_id', user.id).not('phone', 'is', null).limit(1).maybeSingle();
      if (cErr) throw cErr;
      if (cancelled || !c?.phone) return;
      setPhone(c.phone);
    })();
    return () => { cancelled = true; };
  }, [open, user?.id, orgId, phone]);

  const pickupTime = pickupTimeOverride !== null ? pickupTimeOverride : (eventStartAt ? isoMinusMinutes(eventStartAt, 45) : '');
  const returnTime = returnTimeOverride !== null ? returnTimeOverride : (eventEndAt ? isoToLocal(eventEndAt) : '');

  const reset = useCallback(() => {
    setSeats('2'); setRideType('round_trip'); setPickupLocation('');
    setPickupTime(eventStartAt ? isoMinusMinutes(eventStartAt, 45) : '');
    setReturnLocation('');
    setReturnTime(eventEndAt ? isoToLocal(eventEndAt) : '');
    setVehicle(''); setPhone(''); setNotes('');
    setSubmitting(false); setError(null);
  }, [eventStartAt, eventEndAt]);

  const handleClose = useCallback(() => { reset(); onClose?.(); }, [reset, onClose]);

  const handleSubmit = useCallback(async (e) => {
    e?.preventDefault();
    if (hasActiveOffer) { setError('You already have an active offer on this event. Cancel it first to post a new one.'); return; }
    if (!pickupLocation.trim()) { setError('Pickup location is required.'); return; }
    if (!pickupTime) { setError('Pickup time is required so riders know when to be ready.'); return; }
    if (eventStartAt && new Date(pickupTime) > new Date(eventStartAt)) { setError('Pickup time must be before the event starts.'); return; }
    const isRoundTrip = rideType === 'round_trip';
    if (isRoundTrip && returnTime && new Date(returnTime) < new Date(pickupTime)) { setError('Return time must be after pickup time.'); return; }
    const seatsNum = Number(seats);
    if (!seatsNum || seatsNum < 1 || seatsNum > 12) { setError('Seats must be between 1 and 12.'); return; }
    setSubmitting(true);
    setError(null);
    const result = await onSubmit?.({
      seats_offered: seatsNum,
      ride_type: rideType,
      pickup_location: pickupLocation.trim(),
      pickup_time: pickupTime ? new Date(pickupTime).toISOString() : null,
      return_location: isRoundTrip ? (returnLocation.trim() || pickupLocation.trim()) : null,
      return_time: isRoundTrip && returnTime ? new Date(returnTime).toISOString() : null,
      vehicle_description: vehicle.trim() || null,
      driver_phone: phone.trim() || null,
      notes: notes.trim() || null,
    });
    setSubmitting(false);
    if (result?.ok) handleClose();
    else setError(result?.error?.message || "Looks like that didn't go through. Try again?");
  }, [seats, rideType, pickupLocation, pickupTime, returnLocation, returnTime, vehicle, phone, notes, eventStartAt, hasActiveOffer, onSubmit, handleClose]);

  return (
    <FullScreenForm
      open={open}
      onClose={handleClose}
      title="Offer a ride"
      footer={
        <Button type="submit" form="post-offer-form" disabled={submitting}>
          {submitting ? 'Posting…' : 'Post offer'}
        </Button>
      }
    >
      <form id="post-offer-form" onSubmit={handleSubmit} style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {error && <div role="alert" style={{ padding: 10, borderRadius: 8, backgroundColor: 'var(--em-danger-soft)', color: 'var(--em-danger)', fontSize: 13 }}>{error}</div>}
        <Input label="Seats available" id="seats" type="number" inputMode="numeric" min="1" max="12" value={seats} onChange={(e) => setSeats(e.target.value)} required />
        <div><label style={labelStyle} htmlFor="rideType">Trip type</label>
          <select id="rideType" value={rideType} onChange={(e) => setRideType(e.target.value)} style={selectStyle}>
            <option value="round_trip">Round trip</option>
            <option value="arrival_only">Arrival only</option>
            <option value="return_only">Return only</option>
          </select>
        </div>
        <Input label="Pickup from" id="pickup" type="text" value={pickupLocation} onChange={(e) => setPickupLocation(e.target.value)} placeholder="e.g., Armonk Town Center" autoFocus />
        <Input label="Pickup time" id="pickupTime" type="datetime-local" value={pickupTime} onChange={(e) => setPickupTime(e.target.value)} max={eventStartAt ? isoToLocal(eventStartAt) : undefined} />
        {rideType === 'round_trip' && (<>
          <Input label="Return to (optional)" id="returnLoc" type="text" value={returnLocation} onChange={(e) => setReturnLocation(e.target.value)} placeholder="Defaults to pickup location" />
          <Input label="Return time (optional)" id="returnTime" type="datetime-local" value={returnTime} onChange={(e) => setReturnTime(e.target.value)} min={pickupTime || undefined} />
        </>)}
        <Input label="Vehicle (optional)" id="vehicle" type="text" value={vehicle} onChange={(e) => setVehicle(e.target.value)} placeholder="e.g., Black Tesla Model Y" />
        <Input label="Phone (optional, shown to confirmed riders only)" id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(914) 555-1234" />
        <div><label style={labelStyle} htmlFor="notes">Notes (optional)</label><textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows="3" placeholder="e.g., Will swing by Bedford on the way" style={{ width: '100%', minHeight: 80, padding: '10px 12px', borderRadius: 10, border: '1.5px solid var(--em-border-default)', backgroundColor: 'var(--em-bg-tertiary)', color: 'var(--em-text-primary)', fontSize: 15, fontFamily: 'inherit' }} /></div>
      </form>
    </FullScreenForm>
  );
}

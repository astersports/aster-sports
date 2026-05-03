// src/components/ride/OfferCard.jsx
// Phase 1.5 rides Phase B — display card for a single ride offer.
// Density-aware (rides-list sectionKey). Renders different CTAs based on
// viewer role: driver sees Cancel, riders see Claim or claim status + Cancel.
// Driver phone privacy-gated to confirmed claimers only (§16.7).
// CTA buttons call props; forms ship in Phase C; wiring lands in Phase D.

import { useCallback } from 'react';
import { Car, Users, MapPin, Clock, ArrowRight, Repeat, Phone } from 'lucide-react';
import { useDensity } from '../../hooks/useDensity';
import ClaimStatusPill from './ClaimStatusPill';
import ClaimerRow from './ClaimerRow';

const SECTION_KEY = 'rides-list';

const RIDE_TYPE_LABEL = {
  round_trip: 'Round trip',
  arrival_only: 'Arrival only',
  return_only: 'Return only',
};

function formatTime(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit', hour12: true });
}

export default function OfferCard({
  offer,
  myClaim = null,
  isDriver = false,
  canModerate = false,
  driverName = 'Driver',
  seatsTaken = 0,
  offerClaimers = [],
  onClaim,
  onCancelOffer,
  onCancelClaim,
}) {
  const { density } = useDensity(SECTION_KEY);
  const rideTypeLabel = RIDE_TYPE_LABEL[offer.ride_type] ?? 'Ride';
  const seatsAvailable = Math.max(0, (offer.seats_offered ?? 0) - seatsTaken);
  const showDriverPhone = !isDriver && myClaim?.status === 'confirmed' && offer.driver_phone;
  const isFull = seatsAvailable === 0;

  const handleCancelOffer = useCallback(() => {
    const message = canModerate && !isDriver
      ? "Cancel this ride offer as admin override? Anyone who claimed a seat will be auto-cancelled and notified."
      : "Cancel this ride offer? Anyone who claimed a seat will need to find another ride.";
    const proceed = window.confirm(message);
    if (proceed) onCancelOffer?.(offer.id);
  }, [offer.id, isDriver, canModerate, onCancelOffer]);

  const handleCancelClaim = useCallback(() => {
    if (!myClaim) return;
    const proceed = window.confirm("Cancel your seat? You can claim again later if a spot opens up.");
    if (proceed) onCancelClaim?.(myClaim.id);
  }, [myClaim, onCancelClaim]);

  const handleClaim = useCallback(() => onClaim?.(offer), [offer, onClaim]);

  return (
    <div
      style={{
        backgroundColor: 'var(--em-bg-card)',
        border: '1px solid var(--em-border-default)',
        borderRadius: 10,
        marginBottom: 10,
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px', borderBottom: density === 'minimal' ? 'none' : '1px solid var(--em-border-subtle)' }}>
        <Car size={16} strokeWidth={1.75} color="var(--em-text-secondary)" aria-hidden="true" />
        <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--em-text-primary)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {driverName}
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 600, color: 'var(--em-text-tertiary)', letterSpacing: '0.02em' }}>
          <Users size={11} strokeWidth={1.75} aria-hidden="true" />
          {seatsAvailable}/{offer.seats_offered}
        </span>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--em-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '2px 6px', borderRadius: 4, backgroundColor: 'var(--em-bg-secondary)' }}>
          {rideTypeLabel}
        </span>
        <ClaimStatusPill claim={myClaim} />
      </div>

      {density !== 'minimal' && (
        <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: 'var(--em-text-secondary)' }}>
          {offer.pickup_location && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <MapPin size={13} strokeWidth={1.75} color="var(--em-text-tertiary)" aria-hidden="true" />
              <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{offer.pickup_location}</span>
              {formatTime(offer.pickup_time) && <span style={{ color: 'var(--em-text-tertiary)', fontSize: 12 }}>{formatTime(offer.pickup_time)}</span>}
            </div>
          )}
          {density !== 'minimal' && offer.ride_type === 'round_trip' && offer.return_location && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Repeat size={13} strokeWidth={1.75} color="var(--em-text-tertiary)" aria-hidden="true" />
              <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{offer.return_location}</span>
              {formatTime(offer.return_time) && <span style={{ color: 'var(--em-text-tertiary)', fontSize: 12 }}>{formatTime(offer.return_time)}</span>}
            </div>
          )}
          {density !== 'minimal' && offer.vehicle_description && (
            <div style={{ fontSize: 13, color: 'var(--em-text-tertiary)' }}>{offer.vehicle_description}</div>
          )}
          {density !== 'minimal' && offer.notes && (
            <div style={{ fontSize: 13, color: 'var(--em-text-secondary)', fontStyle: 'italic' }}>{offer.notes}</div>
          )}
          {showDriverPhone && (
            <a href={`tel:${offer.driver_phone}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--em-accent)', textDecoration: 'none', fontWeight: 500 }} aria-label={`Call driver at ${offer.driver_phone}`}>
              <Phone size={13} strokeWidth={1.75} aria-hidden="true" />
              {offer.driver_phone}
            </a>
          )}
        </div>
      )}

      {isDriver && density !== 'minimal' && offerClaimers.length > 0 && (
        <div style={{ borderTop: '1px solid var(--em-border-subtle)', padding: '8px 14px 6px' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--em-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
            {offerClaimers.length} {offerClaimers.length === 1 ? 'rider' : 'riders'}
          </div>
          {offerClaimers.map(({ claim, riderName, childName }) => (
            <ClaimerRow key={claim.id} claim={claim} riderName={riderName} childName={childName} />
          ))}
        </div>
      )}
      <div style={{ padding: '8px 14px 12px', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        {isDriver ? (
          <button type="button" onClick={handleCancelOffer} className="sf-press" aria-label="Cancel this ride offer" style={{ minHeight: 36, padding: '0 12px', borderRadius: 8, border: '1px solid var(--em-border-default)', backgroundColor: 'var(--em-bg-card)', color: 'var(--em-danger)', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
            Cancel offer
          </button>
        ) : canModerate ? (
          <button type="button" onClick={handleCancelOffer} className="sf-press" aria-label="Cancel this ride offer (admin override)" style={{ minHeight: 36, padding: '0 12px', borderRadius: 8, border: '1px solid var(--em-border-default)', backgroundColor: 'var(--em-bg-card)', color: 'var(--em-danger)', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
            Override · Cancel
          </button>
        ) : myClaim && myClaim.status !== 'cancelled' && myClaim.status !== 'declined' ? (
          <button type="button" onClick={handleCancelClaim} className="sf-press" aria-label="Cancel your claim on this ride" style={{ minHeight: 36, padding: '0 12px', borderRadius: 8, border: '1px solid var(--em-border-default)', backgroundColor: 'var(--em-bg-card)', color: 'var(--em-text-primary)', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
            Cancel my seat
          </button>
        ) : (
          <button type="button" onClick={handleClaim} disabled={isFull} className="sf-press" aria-label={isFull ? 'No seats available' : 'Claim a seat on this ride'} style={{ minHeight: 36, padding: '0 14px', borderRadius: 8, border: 'none', backgroundColor: isFull ? 'var(--em-bg-secondary)' : 'var(--em-accent)', color: isFull ? 'var(--em-text-tertiary)' : 'var(--em-text-inverse)', fontSize: 13, fontWeight: 600, cursor: isFull ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            {isFull ? 'Full' : (<>Claim a seat <ArrowRight size={13} strokeWidth={1.75} aria-hidden="true" /></>)}
          </button>
        )}
      </div>
    </div>
  );
}

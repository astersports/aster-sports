// src/components/event/EventRidesTab.jsx
// Phase 1.5 rides Phase D — wire-up against new offers/claims model.
// Replaces broken event_rides queries from prior implementation.
// Per CLAUDE.md anti-pattern #5: full rewrite justified (>50% changes,
// existing version was non-functional since Migration 025).

import { useState, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useRideOffers } from '../../hooks/useRideOffers';
import { useRideClaims } from '../../hooks/useRideClaims';
import { useDriverNames } from '../../hooks/useDriverNames';
import OfferCard from '../ride/OfferCard';
import PostOfferForm from '../ride/PostOfferForm';
import ClaimSeatForm from '../ride/ClaimSeatForm';

const sectionLabelStyle = { fontSize: 11, fontWeight: 600, color: 'var(--em-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 };
const emptyStateStyle = { padding: 24, textAlign: 'center', color: 'var(--em-text-tertiary)', fontSize: 13, border: '1px dashed var(--em-border-subtle)', borderRadius: 10 };

export default function EventRidesTab({ event }) {
  const { user, orgId, role } = useAuth();
  const canModerate = role === 'admin';
  const eventId = event?.id;
  const rideEnabled = event?.ride_coordination_enabled !== false;

  const { offers, loading: offersLoading, postOffer, cancelOffer } = useRideOffers(eventId);
  const { claims, loading: claimsLoading, claimSeat, cancelClaim } = useRideClaims(eventId);

  const [postOfferOpen, setPostOfferOpen] = useState(false);
  const [claimTargetOffer, setClaimTargetOffer] = useState(null);

  const driverIds = useMemo(() => offers.map((o) => o.driver_user_id), [offers]);
  const driverNames = useDriverNames(orgId, driverIds);

  const myClaimsByOfferId = useMemo(() => {
    const result = {};
    claims.forEach((c) => {
      if (c.rider_user_id !== user?.id) return;
      if (c.status === 'cancelled' || c.status === 'declined') return;
      result[c.offer_id] = c;
    });
    return result;
  }, [claims, user]);

  const seatsTakenByOfferId = useMemo(() => {
    const result = {};
    claims.forEach((c) => {
      if (c.status !== 'pending' && c.status !== 'confirmed') return;
      result[c.offer_id] = (result[c.offer_id] || 0) + (c.seats_requested || 1);
    });
    return result;
  }, [claims]);

  const myActiveClaims = useMemo(
    () => claims.filter((c) => c.rider_user_id === user?.id && c.status !== 'cancelled' && c.status !== 'declined'),
    [claims, user],
  );

  if (!rideEnabled) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: 'var(--em-text-tertiary)', fontSize: 14 }}>
        Ride coordination is off for this event.
      </div>
    );
  }

  const loading = offersLoading || claimsLoading;
  const otherOffers = offers.filter((o) => !myClaimsByOfferId[o.id]);

  return (
    <div style={{ padding: '12px 16px 80px' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
        <button type="button" onClick={() => setPostOfferOpen(true)} className="sf-press" aria-label="Offer a ride" style={{ minHeight: 36, padding: '0 12px', borderRadius: 8, border: 'none', backgroundColor: 'var(--em-accent)', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Plus size={14} strokeWidth={2} aria-hidden="true" />
          Offer a ride
        </button>
      </div>

      {loading && (
        <div style={{ padding: 24, textAlign: 'center', color: 'var(--em-text-tertiary)', fontSize: 13 }} role="status" aria-live="polite">
          Loading rides…
        </div>
      )}

      {!loading && myActiveClaims.length > 0 && (
        <section aria-label="Your claimed seats" style={{ marginBottom: 18 }}>
          <h3 style={sectionLabelStyle}>Your seats</h3>
          {myActiveClaims.map((claim) => {
            const offer = offers.find((o) => o.id === claim.offer_id);
            if (!offer) return null;
            return (
              <OfferCard
                key={claim.id}
                offer={offer}
                myClaim={claim}
                isDriver={false}
                canModerate={canModerate}
                driverName={driverNames[offer.driver_user_id] || 'Driver'}
                seatsTaken={seatsTakenByOfferId[offer.id] || 0}
                onCancelClaim={cancelClaim}
              />
            );
          })}
        </section>
      )}

      {!loading && !(myActiveClaims.length > 0 && otherOffers.length === 0) && (
        <section aria-label="Available rides">
          <h3 style={sectionLabelStyle}>Available rides</h3>
          {otherOffers.length === 0 ? (
            <div style={emptyStateStyle}>
              No rides offered yet — be the first to share?
            </div>
          ) : otherOffers.map((offer) => (
            <OfferCard
              key={offer.id}
              offer={offer}
              myClaim={null}
              isDriver={offer.driver_user_id === user?.id}
              canModerate={canModerate}
              driverName={driverNames[offer.driver_user_id] || 'Driver'}
              seatsTaken={seatsTakenByOfferId[offer.id] || 0}
              onClaim={(o) => setClaimTargetOffer(o)}
              onCancelOffer={cancelOffer}
            />
          ))}
        </section>
      )}

      <PostOfferForm
        open={postOfferOpen}
        onClose={() => setPostOfferOpen(false)}
        onSubmit={postOffer}
      />
      <ClaimSeatForm
        open={!!claimTargetOffer}
        offer={claimTargetOffer}
        onClose={() => setClaimTargetOffer(null)}
        onSubmit={claimSeat}
      />
    </div>
  );
}

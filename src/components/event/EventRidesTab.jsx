// src/components/event/EventRidesTab.jsx
// Phase 1.5 rides Phase D — wire-up against new offers/claims model.
// Replaces broken event_rides queries from prior implementation.
// Per CLAUDE.md anti-pattern #5: full rewrite justified (>50% changes,
// existing version was non-functional since Migration 025).

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useEventRidesView } from '../../hooks/useEventRidesView';
import DensityToggle from '../home/DensityToggle';
import OfferCard from '../ride/OfferCard';
import PostOfferForm from '../ride/PostOfferForm';
import ClaimSeatForm from '../ride/ClaimSeatForm';
import Button from '../shared/Button';

const sectionLabelStyle = { fontSize: 11, fontWeight: 600, color: 'var(--em-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 };
const emptyStateStyle = { padding: 24, textAlign: 'center', color: 'var(--em-text-tertiary)', fontSize: 13, border: '1px dashed var(--em-border-subtle)', borderRadius: 10 };

export default function EventRidesTab({ event }) {
  const { user, orgId, role } = useAuth();
  const canModerate = role === 'admin';
  const eventId = event?.id;
  const rideEnabled = event?.enable_rides === true;

  const {
    offers,
    driverNames,
    buildOfferClaimers,
    seatsTakenByOfferId,
    myActiveClaims,
    otherOffers,
    loading,
    postOffer,
    claimSeat,
    cancelOffer,
    cancelClaim,
    confirmClaim,
    declineClaim,
  } = useEventRidesView({ eventId, orgId, userId: user?.id });

  const [postOfferOpen, setPostOfferOpen] = useState(false);
  const [claimTargetOffer, setClaimTargetOffer] = useState(null);

  if (!rideEnabled) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: 'var(--em-text-tertiary)', fontSize: 15 }}>
        Ride coordination is off for this event.
      </div>
    );
  }

  return (
    <div style={{ padding: '12px 16px 80px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>{offers.length > 0 && <DensityToggle sectionKey="rides-list" />}</div>
        <Button size="sm" onClick={() => setPostOfferOpen(true)} aria-label="Offer a ride">
          <Plus size={14} strokeWidth={2} aria-hidden="true" />
          Offer a ride
        </Button>
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
                offerClaimers={buildOfferClaimers(offer.id)}
                onCancelClaim={cancelClaim}
                onConfirmClaim={confirmClaim}
                onDeclineClaim={declineClaim}
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
              No rides offered yet. Tap + Offer a ride to help the team get there.
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
              offerClaimers={buildOfferClaimers(offer.id)}
              onClaim={(o) => setClaimTargetOffer(o)}
              onCancelOffer={cancelOffer}
              onConfirmClaim={confirmClaim}
              onDeclineClaim={declineClaim}
            />
          ))}
        </section>
      )}

      <PostOfferForm
        open={postOfferOpen}
        onClose={() => setPostOfferOpen(false)}
        onSubmit={postOffer}
        eventStartAt={event?.start_at ?? null}
        eventEndAt={event?.end_at ?? null}
        hasActiveOffer={offers.some((o) => o.driver_user_id === user?.id && o.status === 'active')}
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

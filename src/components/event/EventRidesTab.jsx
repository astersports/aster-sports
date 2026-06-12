import { useEffect, useState } from 'react';
import { Hand, Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useEventRidesView } from '../../hooks/useEventRidesView';
import { useRideRequests } from '../../hooks/useRideRequests';
import { useDriverNames } from '../../hooks/useDriverNames';
import { supabase } from '../../lib/supabase';
import DensityToggle from '../home/DensityToggle';
import OfferCard from '../ride/OfferCard';
import PostOfferForm from '../ride/PostOfferForm';
import LoadingSkeleton from '../shared/LoadingSkeleton';
import ClaimSeatForm from '../ride/ClaimSeatForm';
import RequestRideForm from '../ride/RequestRideForm';
import RideRequestCard from '../ride/RideRequestCard';
import Button from '../shared/Button';
import { ridesEnabledFor } from '../../lib/featureGates';
const lblStyle = { fontSize: 11, fontWeight: 600, color: 'var(--as-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 };
const emptyStyle = { padding: 24, textAlign: 'center', color: 'var(--as-text-tertiary)', fontSize: 13, border: '1px dashed var(--as-border-subtle)', borderRadius: 10 };

export default function EventRidesTab({ event }) {
  const { user, orgId, role, org } = useAuth();
  const canModerate = role === 'admin';
  const eventId = event?.id, rideEnabled = ridesEnabledFor(org, event); // defense-in-depth under the page-level F-3 gate

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

  const { openRequests, myOpenRequest, postRequest, cancelRequest } = useRideRequests(eventId);
  const requestNames = useDriverNames(orgId, openRequests.map((r) => r.requester_user_id));
  const [childNames, setChildNames] = useState({});
  const [postOfferOpen, setPostOfferOpen] = useState(false);
  // BUG-004: symmetric guard — same user can't both offer + request.
  const myActiveOffer = offers.some((o) => o.driver_user_id === user?.id && o.status === 'active');

  useEffect(() => {
    const ids = openRequests.map((r) => r.for_child_id).filter(Boolean);
    if (ids.length === 0) return;
    supabase.from('players').select('id, first_name').in('id', ids)
      .then(({ data, error }) => {
        if (error) console.error('EventRidesTab childNames:', error.message);
        const map = {};
        (data || []).forEach((p) => { map[p.id] = p.first_name; });
        Promise.resolve().then(() => setChildNames(map));
      });
  }, [openRequests]);
  const [requestFormOpen, setRequestFormOpen] = useState(false);
  const [claimTargetOffer, setClaimTargetOffer] = useState(null);

  if (!rideEnabled) return <div style={{ padding: 24, textAlign: 'center', color: 'var(--as-text-tertiary)', fontSize: 15 }}>Ride coordination is off for this event.</div>;

  return (
    <div style={{ padding: '12px 16px 80px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <div style={{ flex: 1 }}>{offers.length > 0 && <DensityToggle sectionKey="rides-list" />}</div>
        {!myOpenRequest && !myActiveOffer && (
          <Button size="sm" variant="secondary" onClick={() => setRequestFormOpen(true)} aria-label="Request a ride">
            <Hand size={14} strokeWidth={2} /> Need ride
          </Button>
        )}
        {!myOpenRequest && (<Button size="sm" onClick={() => setPostOfferOpen(true)} aria-label="Offer a ride"><Plus size={14} strokeWidth={2} /> Offer ride</Button>)}
      </div>

      {openRequests.length > 0 && (
        <section aria-label="Ride requests" style={{ marginBottom: 16 }}>
          <h3 style={lblStyle}>Ride requests</h3>
          {openRequests.map((req) => (
            <RideRequestCard key={req.id} request={req} requesterName={requestNames[req.requester_user_id] || 'Parent'} childName={childNames[req.for_child_id] || null} isMine={req.requester_user_id === user?.id} onCancel={cancelRequest} />
          ))}
        </section>
      )}

      {loading && <div style={{ padding: 16 }}><LoadingSkeleton variant="card" count={2} /></div>}

      {!loading && myActiveClaims.length > 0 && (
        <section aria-label="Your claimed seats" style={{ marginBottom: 18 }}>
          <h3 style={lblStyle}>Your seats</h3>
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
          <h3 style={lblStyle}>Available rides</h3>
          {otherOffers.length === 0 ? (
            <div style={emptyStyle}>
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
      <ClaimSeatForm open={!!claimTargetOffer} offer={claimTargetOffer} eventTeamId={event?.team_id} onClose={() => setClaimTargetOffer(null)} onSubmit={claimSeat} />
      <RequestRideForm open={requestFormOpen} onClose={() => setRequestFormOpen(false)} onSubmit={postRequest} eventTeamId={event?.team_id} />
    </div>
  );
}

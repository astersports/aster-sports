// src/hooks/useEventRidesView.js
// Phase 1.5 Ship 6.1 — view-model hook for EventRidesTab.
// Composes offers + claims + driver names + claimer resolution into a single
// pre-computed view. Pulls 4 useMemo blocks out of EventRidesTab to give the
// component breathing room for density chip + future ride features.

import { useMemo } from 'react';
import { useRideOffers } from './useRideOffers';
import { useRideClaims } from './useRideClaims';
import { useDriverNames } from './useDriverNames';
import { useOfferClaimers } from './useOfferClaimers';

export function useEventRidesView({ eventId, orgId, userId }) {
  const { offers, postOffer, cancelOffer, loading: offersLoading } = useRideOffers(eventId);
  const { claims, claimSeat, cancelClaim, loading: claimsLoading } = useRideClaims(eventId);

  const driverIds = useMemo(() => offers.map((o) => o.driver_user_id), [offers]);
  const driverNames = useDriverNames(orgId, driverIds);
  const buildOfferClaimers = useOfferClaimers(orgId, claims);

  const myClaimsByOfferId = useMemo(() => {
    const result = {};
    claims.forEach((c) => {
      if (c.rider_user_id !== userId) return;
      if (c.status === 'cancelled' || c.status === 'declined') return;
      result[c.offer_id] = c;
    });
    return result;
  }, [claims, userId]);

  const seatsTakenByOfferId = useMemo(() => {
    const result = {};
    claims.forEach((c) => {
      if (c.status !== 'pending' && c.status !== 'confirmed') return;
      result[c.offer_id] = (result[c.offer_id] || 0) + (c.seats_requested || 1);
    });
    return result;
  }, [claims]);

  const myActiveClaims = useMemo(
    () => claims.filter((c) => c.rider_user_id === userId && c.status !== 'cancelled' && c.status !== 'declined'),
    [claims, userId],
  );

  const otherOffers = useMemo(
    () => offers.filter((o) => !myClaimsByOfferId[o.id]),
    [offers, myClaimsByOfferId],
  );

  return {
    offers,
    claims,
    driverNames,
    buildOfferClaimers,
    myClaimsByOfferId,
    seatsTakenByOfferId,
    myActiveClaims,
    otherOffers,
    postOffer,
    claimSeat,
    cancelOffer,
    cancelClaim,
    loading: offersLoading || claimsLoading,
  };
}

// src/hooks/useOfferClaimers.js
// Phase D.2 Ship 4 — composes claim data with rider + child name resolution.
// Returns builder function: offerId => [{ claim, riderName, childName }]
// Excludes cancelled + declined claims (driver only cares about active claimers).

import { useMemo, useCallback } from 'react';
import { useDriverNames } from './useDriverNames';
import { usePlayerNamesByIds } from './usePlayerNamesByIds';

export function useOfferClaimers(orgId, claims) {
  const claimsByOfferId = useMemo(() => {
    const result = {};
    (claims || []).forEach((c) => {
      if (c.status === 'cancelled' || c.status === 'declined') return;
      if (!result[c.offer_id]) result[c.offer_id] = [];
      result[c.offer_id].push(c);
    });
    return result;
  }, [claims]);

  const riderUserIds = useMemo(
    () => (claims || []).map((c) => c.rider_user_id).filter(Boolean),
    [claims],
  );
  const riderNames = useDriverNames(orgId, riderUserIds);

  const childIds = useMemo(
    () => (claims || []).map((c) => c.for_child_id).filter(Boolean),
    [claims],
  );
  const childNames = usePlayerNamesByIds(orgId, childIds);

  return useCallback(
    (offerId) => {
      const offerClaims = claimsByOfferId[offerId] || [];
      return offerClaims.map((c) => ({
        claim: c,
        riderName: riderNames[c.rider_user_id] || 'Rider',
        childName: c.for_child_id ? childNames[c.for_child_id] || null : null,
      }));
    },
    [claimsByOfferId, riderNames, childNames],
  );
}

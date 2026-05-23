// @vitest-environment jsdom
//
// BUG-004 (§4.E): same user can't both offer AND request a ride for
// the same event. Pre-fix EventRidesTab hid the "Need ride" button when
// the user had an open request (via !myOpenRequest), but the reverse
// direction was unguarded — "Offer ride" stayed visible when the user
// had an open request, and "Need ride" stayed visible when the user
// had an active offer.
//
// Fix locks both directions. Invariant per AP #43.

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

const ridesViewState = { offers: [], openClaims: [] };
const rideRequestsState = { openRequests: [], myOpenRequest: null };
const USER_ID = 'u-frank';

vi.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({ user: { id: USER_ID }, orgId: 'org-1' }),
}));
vi.mock('../../../hooks/useEventRidesView', () => ({
  useEventRidesView: () => ({
    offers: ridesViewState.offers,
    driverNames: {}, buildOfferClaimers: () => [], seatsTakenByOfferId: {},
    myActiveClaims: [], otherOffers: [], loading: false,
    postOffer: vi.fn(), claimSeat: vi.fn(), cancelOffer: vi.fn(),
    cancelClaim: vi.fn(), confirmClaim: vi.fn(), declineClaim: vi.fn(),
  }),
}));
vi.mock('../../../hooks/useRideRequests', () => ({
  useRideRequests: () => ({
    openRequests: rideRequestsState.openRequests,
    myOpenRequest: rideRequestsState.myOpenRequest,
    postRequest: vi.fn(), cancelRequest: vi.fn(),
  }),
}));
vi.mock('../../../hooks/useDriverNames', () => ({ useDriverNames: () => ({}) }));
vi.mock('../../../hooks/useOrgSettings', () => ({ useOrgSettings: () => ({ orgSettings: { ride_coordination_enabled: true } }) }));
vi.mock('../../../lib/supabase', () => ({ supabase: { from: () => ({ select: () => ({ in: () => Promise.resolve({ data: [], error: null }) }) }) } }));
vi.mock('../../home/DensityToggle', () => ({ default: () => null }));
vi.mock('../../ride/OfferCard', () => ({ default: () => null }));
vi.mock('../../ride/RideRequestCard', () => ({ default: () => null }));
vi.mock('../../ride/PostOfferForm', () => ({ default: () => null }));
vi.mock('../../ride/ClaimSeatForm', () => ({ default: () => null }));
vi.mock('../../ride/RequestRideForm', () => ({ default: () => null }));

const { default: EventRidesTab } = await import('../EventRidesTab');

afterEach(() => {
  cleanup();
  ridesViewState.offers = [];
  ridesViewState.openClaims = [];
  rideRequestsState.openRequests = [];
  rideRequestsState.myOpenRequest = null;
});

const EVENT = { id: 'e-1', team_id: 't-1', start_at: '2026-05-25T19:00:00Z', enable_rides: true };

describe('EventRidesTab — BUG-004 symmetric guard', () => {
  it('1. no offer + no request: both "Need ride" and "Offer ride" buttons visible', () => {
    render(<EventRidesTab event={EVENT} eventId="e-1" />);
    expect(screen.queryByRole('button', { name: /Request a ride/i })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Offer a ride/i })).toBeTruthy();
  });

  it('2. user has open request: BOTH buttons hidden (was bug: "Offer ride" stayed visible)', () => {
    rideRequestsState.myOpenRequest = { id: 'r-1', requester_user_id: USER_ID };
    render(<EventRidesTab event={EVENT} eventId="e-1" />);
    expect(screen.queryByRole('button', { name: /Request a ride/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /Offer a ride/i })).toBeNull();
  });

  it('3. user has active offer: "Need ride" hidden (was bug: stayed visible)', () => {
    ridesViewState.offers = [{ id: 'o-1', driver_user_id: USER_ID, status: 'active' }];
    render(<EventRidesTab event={EVENT} eventId="e-1" />);
    expect(screen.queryByRole('button', { name: /Request a ride/i })).toBeNull();
    // "Offer ride" stays visible — PostOfferForm internally handles
    // hasActiveOffer via prop (line ~144).
    expect(screen.queryByRole('button', { name: /Offer a ride/i })).toBeTruthy();
  });

  it('4. other user has active offer: this user can still both offer + request', () => {
    ridesViewState.offers = [{ id: 'o-1', driver_user_id: 'u-other', status: 'active' }];
    render(<EventRidesTab event={EVENT} eventId="e-1" />);
    expect(screen.queryByRole('button', { name: /Request a ride/i })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Offer a ride/i })).toBeTruthy();
  });

  it('5. inactive offer (cancelled, etc.) does not trigger the guard', () => {
    ridesViewState.offers = [{ id: 'o-1', driver_user_id: USER_ID, status: 'cancelled' }];
    render(<EventRidesTab event={EVENT} eventId="e-1" />);
    expect(screen.queryByRole('button', { name: /Request a ride/i })).toBeTruthy();
  });
});

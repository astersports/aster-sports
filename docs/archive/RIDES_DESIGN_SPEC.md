# SKYFIRE / EMBER — RIDES DESIGN SPECIFICATION

**Version:** 1.0
**Written:** April 24, 2026
**Status:** APPROVED — ready for Phase 1 implementation
**Depends on:** Migration 025 (rides schema redesign)

---

## PURPOSE

Ride coordination is the highest-friction parent workflow in youth sports. This spec defines the complete ride offer/claim system across all 3 roles (Parent, Coach, Admin).

---

## LOCKED DESIGN DECISIONS

1. Model C for ride direction: Round-trip default, arrival-only and return-only opt-in
2. Separate metrics: Arrival coverage and return coverage tracked independently
3. Separate location fields: pickup_location + return_location, symmetric default
4. Offers + Claims are separate entities
5. Auto-confirm claim after 12 hours of driver silence
6. Waitlist mechanic for overflow
7. Unmatched rider tracking visible to coach + admin
8. Coach notified at T-72h if coverage below 80%
9. Coach + admin notified at T-24h if unmatched riders exist
10. Driver one-tap "Can't drive today" cancel notifies all claimants

---

## SECTION 1: DATA MODEL

### 1.1 event_ride_offers

- id uuid PK
- event_id uuid FK
- org_id uuid FK
- driver_user_id uuid FK auth.users
- seats_offered integer CHECK > 0
- ride_type text CHECK IN (round_trip, arrival_only, return_only) DEFAULT round_trip
- pickup_location text NOT NULL
- pickup_time timestamptz
- return_location text NOT NULL (defaults to pickup_location)
- return_time timestamptz (nullable for arrival_only)
- vehicle_description text optional
- driver_phone text optional
- notes text optional
- status text CHECK IN (active, cancelled) DEFAULT active
- cancelled_at timestamptz
- cancelled_reason text
- created_at timestamptz
- updated_at timestamptz

Constraints:
- UNIQUE (event_id, driver_user_id) WHERE status = active
- CHECK return_time IS NULL OR return_time >= pickup_time
- CHECK ride_type != arrival_only OR return_time IS NULL

### 1.2 event_ride_claims

- id uuid PK
- offer_id uuid FK event_ride_offers
- event_id uuid FK events
- org_id uuid FK
- rider_user_id uuid FK auth.users
- for_child_id uuid FK players nullable
- seats_requested integer CHECK > 0 DEFAULT 1
- pickup_address text
- pickup_notes text optional
- return_needed boolean DEFAULT true
- status text CHECK IN (pending, confirmed, declined, cancelled, waitlisted)
- waitlist_position integer nullable
- confirmed_at timestamptz
- declined_at timestamptz
- declined_reason text
- cancelled_at timestamptz
- cancelled_by text CHECK IN (rider, driver, system, admin)
- created_at timestamptz
- updated_at timestamptz

Constraints:
- UNIQUE (event_id, rider_user_id) WHERE status IN (pending, confirmed, waitlisted)

### 1.3 events addition

- ride_coordination_enabled boolean NOT NULL DEFAULT true

---

## SECTION 2: LIFECYCLE FLOWS

### 2.1 Offer lifecycle
Create -> auto-notify riders -> Driver edits if needed -> Driver cancels triggers cascade to claims

### 2.2 Claim lifecycle
Create pending -> Driver accepts/declines/ignores -> Auto-confirm at T+12h -> Rider or driver can cancel -> Waitlist auto-promotes

### 2.3 Auto-confirm
Scheduled function runs hourly. Pending claims older than 12h auto-confirm. Both parties notified.

### 2.4 Waitlist promotion
When confirmed claim cancelled, first waitlisted claim promotes to pending with fresh 12h clock.

---

## SECTION 3: SCENARIOS (23 total)

SC-1: Happy path - 4 seats, 3 claims, all confirmed
SC-2: Dupe offer attempt - UI blocks with edit mode
SC-3: Overflow - 5 families need rides for 4 seats, waitlist kicks in
SC-4: Driver cancels at T-2h - emergency escalation
SC-5: Driver offers, nobody claims - T-48h prompt
SC-6: Driver with own kids - seats_offered excludes own kids
SC-7: Multi-car family - independent offers
SC-8: Emergency at T-2h - same as SC-4
SC-9: Driver running late (Phase 2)
SC-10: Rider brings extra kid - must edit seats_requested
SC-11: Driver declines specific claim
SC-12: Geography mismatch - distance warning non-blocking
SC-13: Tournament 2-day - independent events
SC-14: Out-of-state tournament
SC-15: Rider already in carpool, tries second claim - blocked
SC-16: Non-parent driver - allowed, labeled
SC-17: Coach offers rides - same as parent
SC-18: Admin force-match - creates pending claim, rider confirms
SC-19: Payment/gas money (Phase 2-3)
SC-20: Background check (Phase 3+)
SC-21: Weather cancellation - cascade cancel all rides
SC-22: RSVP changed to Not Going - prompt to release claim
SC-23: Double-child claim - seats_requested = 2

---

## SECTION 4: PARENT VIEW

Event detail Rides section structure:

1. YOUR RIDE card (priority 1, largest)
   - States: confirmed, pending, needed, driver_cancelled
   - Shows pickup time/location, return time/location, driver info
2. TEAM RIDES OVERVIEW
   - Separate arrival coverage and return coverage progress bars
3. DRIVERS OFFERING list
   - Per-offer card with seats remaining
4. RIDERS NEEDING list
   - Unmatched families, [I can drive them] CTA

Density states:
- Minimal: Personal status one line + team coverage one line
- Medium (default): Full four-section layout
- Maximum: + claim history + driver contacts + carpool chat link

---

## SECTION 5: COACH VIEW

Additional Rides Coordination section above parent view:

1. Arrival coverage metric
2. Return coverage metric
3. Unmatched families list with [Suggest match] CTA
4. [Post team ride request]
5. [Offer rides myself]

Coach notifications:
- T-72h if coverage below 80%: push "Post team request?"
- T-24h if unmatched exist: push to coach + admin

---

## SECTION 6: ADMIN VIEW

Admin home widget:

Rides Today: 5 events, 82% avg coverage
Per-team breakdown with coverage %
[Send program broadcast]

Admin override capabilities:
- Manual match rider to offer
- Override waitlist order
- Cancel driver offer on their behalf
- Post program-wide ride broadcast

Admin audit view:
- Total offers/claims per season
- Confirmation rate
- Cancellation rate by role
- Coverage trends
- Unmatched incidents log
- Per-family participation

---

## SECTION 7: VISUAL DESIGN

### Design tokens
- Inter font, 4px grid, 10px radius, 44px tap target

### State colors
- Confirmed: green #10b981
- Pending: orange #f59e0b
- Cancelled: gray #64748b
- Urgent: red #ef4444
- Waitlisted: purple #a78bfa

### Iconography (Lucide, stroke-width 1.75)
Car, User, Clock, MapPin, Phone, MessageCircle, CheckCircle, AlertCircle, Hourglass, XCircle

### Motion
Claim success checkmark animation
Coverage progress bar smooth updates
Emergency state subtle pulse
Recognition celebrations for 5+ completed rides

### Accessibility
Text indicators alongside all color states
Tel links for one-tap driver call
Distance info announced to screen readers
Haptic feedback (Phase 2 via Capacitor)

---

## SECTION 8: EDGE CASES

### Stale claims
Claim pending past 48h checks driver still active, auto-confirms or cascades cancel

### Race conditions
Database constraint enforces total confirmed + pending <= seats_offered
Second claim auto-waitlists

### Offer deletion
Soft-delete only (status=cancelled). Claims cascade via app logic.

### User account deletion
Soft-delete pattern. Existing offers/claims cascade cancel with system reason.

### Event time changes
Material shift >30min triggers notification to offer drivers + claim riders
Admin can cascade-update pickup_times

---

## SECTION 9: IMPLEMENTATION

### Migration 025 scope
Pre-verify event_rides schema first. Rename to event_ride_offers if commingled. Extract claims to new table. Apply RLS scoped to org members + staff override.

### Frontend files (all under 150 lines each)

src/components/rides/
- YourRideStatusCard.jsx
- TeamRidesOverview.jsx
- DriversList.jsx
- RidersList.jsx
- OfferRideForm.jsx
- ClaimRideForm.jsx
- WaitlistBadge.jsx
- CoachRideDashboard.jsx
- AdminRideWidget.jsx

src/hooks/
- useRideOffers.js
- useRideClaims.js
- useMyRideStatus.js
- useRideCoverage.js

### Edge functions

Scheduled hourly:
- Auto-confirm pending claims >12h
- Check coverage thresholds at T-72h, T-24h
- Promote waitlist when confirmed cancels

Triggered:
- Offer created -> notify riders on event
- Claim created -> notify driver
- Driver cancels -> notify claimants
- Event cancelled -> cascade all rides

### Testing
Unit tests per scenario SC-1 through SC-23
Integration tests for RLS enforcement
Manual UX flow testing across all 3 roles

### Phasing

Phase 1 (Migration 025 + UI):
- Schema redesign
- Basic offer/claim/cancel workflow
- Per-role views
- Coverage metrics
- Waitlist

Phase 2:
- Carpool group chat
- Running late status
- Geography suggestions
- Trust signals

Phase 3:
- Background check integration
- Gas money tracking
- AI match suggestions

---

## VERSION HISTORY

1.0 - April 24, 2026 - Initial specification. Based on IMG_9881.png observations, BUG-004, BUG-005, and full audit with Frank including Model C decision, overflow handling, three-role visual design.

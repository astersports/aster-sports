// Pure aggregator for useRidesTodaySummary. Extracted from the hook
// (PR #335) so the math is unit-testable in isolation. Hook handles
// the fetch + state plumbing; this helper handles the deterministic
// reduction.
//
// PR #338 — added arrival/return coverage split per
// RIDES_DESIGN_SPEC §5 (coach view) + §6 (admin view). Round-trip
// offers contribute seats to both directions; arrival_only contributes
// to arrival only; return_only contributes to return only. Claims
// contribute to arrival (always) and return (if return_needed=true).
//
// Inputs:
//   - ridesEvents: array of { id, teams: { id, name, team_color } }
//   - offers: array of { event_id, seats_offered, ride_type }
//     ride_type ∈ { 'round_trip' (default), 'arrival_only', 'return_only' }
//   - claims: array of { event_id, seats_requested, return_needed, status }
//
// Output:
//   { eventCount, totalSeatsOffered, totalSeatsClaimed, coveragePct, byTeam,
//     arrival: { offered, claimed, coveragePct },
//     return:  { offered, claimed, coveragePct } }
//
// Per-team also carries arrival + return sub-totals.
//
// Counted-claim statuses: confirmed, pending, waitlisted. Cancelled +
// declined are excluded — they're terminal states with no seat
// reservation.

const COUNTED_CLAIM_STATUSES = new Set(['confirmed', 'pending', 'waitlisted']);
const ROUND_TRIP_TYPES = new Set(['round_trip']);
const ARRIVAL_TYPES = new Set(['round_trip', 'arrival_only']);
const RETURN_TYPES = new Set(['round_trip', 'return_only']);

function pct(numerator, denominator) {
  if (!denominator || denominator <= 0) return null;
  return Math.min(100, Math.round((numerator / denominator) * 100));
}

function emptyAggregate() {
  return { offered: 0, claimed: 0 };
}

export function aggregateRidesSummary(ridesEvents, offers, claims) {
  // Per-event tallies, split by direction.
  const arrivalOfferByEvent = {};
  const returnOfferByEvent = {};
  for (const o of offers || []) {
    const type = ROUND_TRIP_TYPES.has(o.ride_type) || !o.ride_type ? 'round_trip' : o.ride_type;
    const seats = o.seats_offered || 0;
    if (ARRIVAL_TYPES.has(type)) {
      arrivalOfferByEvent[o.event_id] = (arrivalOfferByEvent[o.event_id] || 0) + seats;
    }
    if (RETURN_TYPES.has(type)) {
      returnOfferByEvent[o.event_id] = (returnOfferByEvent[o.event_id] || 0) + seats;
    }
  }
  const arrivalClaimByEvent = {};
  const returnClaimByEvent = {};
  for (const c of claims || []) {
    if (!COUNTED_CLAIM_STATUSES.has(c.status)) continue;
    const seats = c.seats_requested || 0;
    arrivalClaimByEvent[c.event_id] = (arrivalClaimByEvent[c.event_id] || 0) + seats;
    if (c.return_needed !== false) {
      // Default: claims need a return ride unless explicitly opted out.
      returnClaimByEvent[c.event_id] = (returnClaimByEvent[c.event_id] || 0) + seats;
    }
  }
  const byTeamMap = {};
  const arrivalTotal = emptyAggregate();
  const returnTotal = emptyAggregate();
  for (const e of ridesEvents || []) {
    const tid = e.teams?.id;
    if (!tid) continue;
    const aOff = arrivalOfferByEvent[e.id] || 0;
    const aCl = arrivalClaimByEvent[e.id] || 0;
    const rOff = returnOfferByEvent[e.id] || 0;
    const rCl = returnClaimByEvent[e.id] || 0;
    arrivalTotal.offered += aOff;
    arrivalTotal.claimed += aCl;
    returnTotal.offered += rOff;
    returnTotal.claimed += rCl;
    if (!byTeamMap[tid]) {
      byTeamMap[tid] = {
        teamId: tid,
        teamName: e.teams.name,
        teamColor: e.teams.team_color,
        eventCount: 0,
        offered: 0,
        claimed: 0,
        arrival: emptyAggregate(),
        return: emptyAggregate(),
      };
    }
    byTeamMap[tid].eventCount += 1;
    // Aggregate offered/claimed = arrival OR return (whichever offered
    // higher capacity wins for the headline tally; same semantics as
    // pre-split when offers were undifferentiated).
    byTeamMap[tid].offered += Math.max(aOff, rOff);
    byTeamMap[tid].claimed += Math.max(aCl, rCl);
    byTeamMap[tid].arrival.offered += aOff;
    byTeamMap[tid].arrival.claimed += aCl;
    byTeamMap[tid].return.offered += rOff;
    byTeamMap[tid].return.claimed += rCl;
  }
  const byTeam = Object.values(byTeamMap).map((t) => ({
    ...t,
    coveragePct: pct(t.claimed, t.offered),
    arrival: { ...t.arrival, coveragePct: pct(t.arrival.claimed, t.arrival.offered) },
    return: { ...t.return, coveragePct: pct(t.return.claimed, t.return.offered) },
  })).sort((a, b) => a.teamName.localeCompare(b.teamName));
  const totalSeatsOffered = Math.max(arrivalTotal.offered, returnTotal.offered);
  const totalSeatsClaimed = Math.max(arrivalTotal.claimed, returnTotal.claimed);
  return {
    eventCount: (ridesEvents || []).length,
    totalSeatsOffered,
    totalSeatsClaimed,
    coveragePct: pct(totalSeatsClaimed, totalSeatsOffered),
    byTeam,
    arrival: { ...arrivalTotal, coveragePct: pct(arrivalTotal.claimed, arrivalTotal.offered) },
    return: { ...returnTotal, coveragePct: pct(returnTotal.claimed, returnTotal.offered) },
  };
}

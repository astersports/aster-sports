// Pure aggregator for useRidesTodaySummary. Extracted from the hook
// (PR #335) so the math is unit-testable in isolation. Hook handles
// the fetch + state plumbing; this helper handles the deterministic
// reduction.
//
// Inputs:
//   - ridesEvents: array of { id, teams: { id, name, team_color } }
//   - offers: array of { event_id, seats_offered }
//   - claims: array of { event_id, seats_requested, status }
//
// Output (matches the hook's data shape):
//   { eventCount, totalSeatsOffered, totalSeatsClaimed, coveragePct, byTeam }
//
// Counted-claim statuses: confirmed, pending, waitlisted. Cancelled +
// declined are excluded — they're terminal states with no seat
// reservation.

const COUNTED_CLAIM_STATUSES = new Set(['confirmed', 'pending', 'waitlisted']);

function pct(numerator, denominator) {
  if (!denominator || denominator <= 0) return null;
  return Math.min(100, Math.round((numerator / denominator) * 100));
}

export function aggregateRidesSummary(ridesEvents, offers, claims) {
  const offerByEvent = {};
  for (const o of offers || []) {
    offerByEvent[o.event_id] = (offerByEvent[o.event_id] || 0) + (o.seats_offered || 0);
  }
  const claimByEvent = {};
  for (const c of claims || []) {
    if (!COUNTED_CLAIM_STATUSES.has(c.status)) continue;
    claimByEvent[c.event_id] = (claimByEvent[c.event_id] || 0) + (c.seats_requested || 0);
  }
  const byTeamMap = {};
  let totalOffered = 0;
  let totalClaimed = 0;
  for (const e of ridesEvents || []) {
    const tid = e.teams?.id;
    if (!tid) continue;
    const offered = offerByEvent[e.id] || 0;
    const claimed = claimByEvent[e.id] || 0;
    totalOffered += offered;
    totalClaimed += claimed;
    if (!byTeamMap[tid]) {
      byTeamMap[tid] = {
        teamId: tid,
        teamName: e.teams.name,
        teamColor: e.teams.team_color,
        eventCount: 0,
        offered: 0,
        claimed: 0,
      };
    }
    byTeamMap[tid].eventCount += 1;
    byTeamMap[tid].offered += offered;
    byTeamMap[tid].claimed += claimed;
  }
  const byTeam = Object.values(byTeamMap).map((t) => ({
    ...t,
    coveragePct: pct(t.claimed, t.offered),
  })).sort((a, b) => a.teamName.localeCompare(b.teamName));
  return {
    eventCount: (ridesEvents || []).length,
    totalSeatsOffered: totalOffered,
    totalSeatsClaimed: totalClaimed,
    coveragePct: pct(totalClaimed, totalOffered),
    byTeam,
  };
}

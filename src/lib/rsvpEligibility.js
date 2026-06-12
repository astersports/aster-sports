// SD-6 eligibility — THE one denominator contract (visual-pass V7.1,
// PR-V1). Both surfaces consume these helpers, so the schedule chip and
// the event-detail hero can never disagree again (the "0/10 vs 14 no
// reply" divergence Frank caught on device, 2026-06-12).
//
// The contract:
//   game/tournament -> rostered kids + ACTIVATED academy kids
//   everything else -> rostered + ALL academy (practices ARE the academy
//                      program; activation only gates games)

export function isGameType(eventType) {
  return eventType === 'game' || eventType === 'tournament';
}

// roster: rows with { id, member_type } (the useRsvps shape).
// activatedSet: Set of player ids activated for THIS event.
export function eligibleRoster(roster, eventType, activatedSet) {
  return (roster || []).filter((p) =>
    p.member_type !== 'futures_academy'
    || (isGameType(eventType) ? Boolean(activatedSet?.has(p.id)) : true));
}

// Count form for the batched schedule path (useScheduleData) — same
// contract, pre-aggregated inputs.
export function denominatorFor(eventType, rosteredCount, academyCount, activatedCount) {
  return isGameType(eventType)
    ? rosteredCount + activatedCount
    : rosteredCount + academyCount;
}

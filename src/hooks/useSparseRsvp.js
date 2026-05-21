// Shared sparse-RSVP detector. Extracted 2026-05-21 (Teams PR B / C1)
// from PlayerRow + MyChildSpotlight (and now TeamDetailHero), which
// each duplicated the same `responsesReceived <= 1` floor. Single
// helper means future tweaks to the threshold ship in one place.
//
// "Sparse" = the player has logged 0 or 1 RSVP responses across all
// past events. Below that floor the Going/Maybe/No %s mislead
// (rendering "3% Going" when 0-of-1 is the actual signal). Callers
// flip to a "No RSVPs yet" empty-state instead.
//
// Exported as a pure function, not a hook, so callers can invoke it
// safely after an early return (rules-of-hooks doesn't apply).
export function isSparseRsvp(player) {
  if (!player) return false;
  const responsesReceived =
    (player.goingCount || 0) +
    (player.maybeCount || 0) +
    (player.declinedCount || 0);
  return responsesReceived <= 1;
}

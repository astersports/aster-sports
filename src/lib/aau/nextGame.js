// Pure next-game picker for the Hub up-next hero (R1·PR-A). Kept in its own
// IO-free module (AP #27) so the unit test can import it without triggering the
// supabase client init that a static import in the hook would.
//
// The next `limit` games with a future start across the merged tracked-team
// schedules, soonest first. get_public_aau_team_schedule sorts ascending but
// interleaves teams, so re-sort the global future set rather than trusting order.
export function pickUpcoming(games, now = Date.now(), limit = 3) {
  if (!Array.isArray(games)) return [];
  return games
    .filter((g) => {
      if (!g || g.status === 'final' || !g.startAt) return false;
      const t = new Date(g.startAt).getTime();
      return !Number.isNaN(t) && t >= now;
    })
    .sort((a, b) => new Date(a.startAt) - new Date(b.startAt))
    .slice(0, limit);
}

// The single soonest future game (the up-next countdown anchor).
export function pickNextGame(games, now = Date.now()) {
  return pickUpcoming(games, now, 1)[0] || null;
}

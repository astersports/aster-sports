// Pure next-game picker for the Hub up-next hero (R1·PR-A). Kept in its own
// IO-free module (AP #27) so the unit test can import it without triggering the
// supabase client init that a static import in the hook would.
//
// The soonest game with a future start across the merged tracked-team
// schedules. get_public_aau_team_schedule sorts ascending but interleaves
// teams, so re-pick the global minimum future start rather than trusting order.
export function pickNextGame(games, now = Date.now()) {
  if (!Array.isArray(games)) return null;
  let best = null;
  for (const g of games) {
    if (!g || g.status === 'final' || !g.startAt) continue;
    const t = new Date(g.startAt).getTime();
    if (Number.isNaN(t) || t < now) continue;
    if (!best || t < best._t) best = { ...g, _t: t };
  }
  return best;
}

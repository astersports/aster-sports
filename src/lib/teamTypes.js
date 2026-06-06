// Team-type semantics (C-12). The platform's team_types split into two
// families: AAU-semantics teams that play games and carry W-L records,
// standings, and tournament brackets — and non-competitive teams (camps,
// clinics, skills-only training, academy/futures pipelines) that are
// time-bounded or game-less.
//
// The C-12 ruling: GROUP non-competitive programs everywhere they belong
// (coach home, schedule, audience pickers, messaging) but type-EXCLUDE them
// from the AAU-semantics surfaces — Records standings, Games standings, and
// the tournament team picker — where a camp team would otherwise render a
// meaningless 0-0 record or be selectable into a bracket it can't play in.
export const COMPETITIVE_TEAM_SLUGS = ['game_team', 'tournament_team', 'hybrid_team'];

// A team is competitive when its joined team_types.slug is in the set. A team
// with no joined type (legacy / pre-team_types rows) defaults to COMPETITIVE
// so existing behavior is unchanged (no-regression) — only an explicitly
// camp / clinic / training-only / academy team is excluded. Reads the slug off
// the `team_types(slug)` embed callers add to their teams select.
export function isCompetitiveTeam(team) {
  const slug = team?.team_types?.slug;
  if (!slug) return true;
  return COMPETITIVE_TEAM_SLUGS.includes(slug);
}

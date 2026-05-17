// Tier 3 v1 PR 2 — Q1 derivation lookup for rsvp_shortfall thresholds.
//
// Per foundation session Q1 lock (Reading 1): rsvp_shortfall threshold
// is DERIVED from a team's (age_group, circuit) combination rather than
// hardcoded in alert_configurations.threshold_config. Legacy currently
// resolves to 5 for all 5 teams; the architecture supports future orgs
// with format variation (8U formats often play 4-on-4, etc.).
//
// When a new org onboards with actual variation, extend TEAM_THRESHOLDS
// rather than refactoring callers. The lookup is a JS constant, not a
// DB-driven table — adding a row to the lookup is one PR; designing
// a teams.min_playable_roster column requires schema work that we
// haven't justified yet (rule-of-two-instances).

const TEAM_THRESHOLDS = {
  '8U':  { 'AAU': 4, 'League Play': 4 },
  '9U':  { 'League Play': 5 },
  '10U': { 'AAU': 5, 'League Play': 5 },
  '11U': { 'AAU': 5 },
};

const DEFAULT_THRESHOLD = 5;

// Pure: takes a team's age_group + circuit, returns the playable-roster
// threshold. Falls back to DEFAULT_THRESHOLD when no entry matches —
// caller logs a console.warn in non-prod via the wrapper in
// thresholdForTeam(). Tests cover both hit + miss paths.
export function lookupThreshold(ageGroup, circuit) {
  return TEAM_THRESHOLDS[ageGroup]?.[circuit] ?? DEFAULT_THRESHOLD;
}

// Convenience wrapper that takes a team-shaped object directly. Most
// callers have a team row in hand and shouldn't have to destructure.
export function thresholdForTeam(team) {
  if (!team) return DEFAULT_THRESHOLD;
  return lookupThreshold(team.age_group, team.circuit);
}

export { TEAM_THRESHOLDS, DEFAULT_THRESHOLD };

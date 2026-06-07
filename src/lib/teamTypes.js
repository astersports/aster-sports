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
import { programRule } from './programRegistry';

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

// ── PR-2: admin team-form support ────────────────────────────────────────
// Selectable team types for the team form. Competitive types carry W-L
// records / standings / brackets; non-competitive are grouped but type-
// excluded from those AAU surfaces.
export const TEAM_TYPE_OPTIONS = [
  { slug: 'game_team', label: 'Game', competitive: true },
  { slug: 'tournament_team', label: 'Tournament', competitive: true },
  { slug: 'hybrid_team', label: 'Hybrid', competitive: true },
  { slug: 'academy', label: 'Academy', competitive: false },
  { slug: 'training_only', label: 'Training', competitive: false },
  { slug: 'clinic_camp', label: 'Clinic / Camp', competitive: false },
];

export function isCompetitiveSlug(slug) {
  return COMPETITIVE_TEAM_SLUGS.includes(slug);
}

// Smart default team_type slug from the parent program's type (GO D3) — reads
// PROGRAM_TYPE_REGISTRY (single source); the admin can override in the form.
export function defaultTeamTypeSlugForProgram(programType) {
  return programRule(programType).defaultTeamType;
}

// Teams PR-2 Part B — coach comp display helpers + per-team summary. The enum
// values match the coaching_assignments role/scope CHECK constraints; labels
// are the human-facing strings. compLine renders a coach's pay line (rate +
// scope) or "Volunteer" when there's no active comp row.

export const COACH_ROLES = [
  { value: 'head_coach', label: 'Head coach' },
  { value: 'assistant', label: 'Assistant' },
  { value: 'team_manager', label: 'Team manager' },
  { value: 'program_director', label: 'Program director' },
];

export const COACH_SCOPES = [
  { value: 'all_events', label: 'All events' },
  { value: 'games_only', label: 'Games only' },
  { value: 'practices_only', label: 'Practices only' },
];

// team_staff.role uses a different CHECK vocabulary (head_coach |
// assistant_coach | manager) than coaching_assignments.role. Map a team_staff
// variant back to the canonical comp enum so labels + the edit-form prefill
// line up when a row falls back to team_staff.role (a volunteer with no comp).
const TEAM_STAFF_TO_COMP = { assistant_coach: 'assistant', manager: 'team_manager' };
export function toCompRole(role) {
  return TEAM_STAFF_TO_COMP[role] || role;
}

export function roleLabel(role) {
  return COACH_ROLES.find((r) => r.value === toCompRole(role))?.label || 'Coach';
}

export function scopeLabel(scope) {
  return COACH_SCOPES.find((s) => s.value === scope)?.label || 'All events';
}

// comp = { rateCents, scope, role } | null. null → volunteer.
export function compLine(comp) {
  if (!comp) return 'Volunteer';
  const cents = comp.rateCents || 0;
  // Whole dollars render as "$38"; non-whole amounts keep 2 decimals ("$37.50")
  // instead of rounding away the cents.
  const dollars = cents % 100 === 0 ? String(cents / 100) : (cents / 100).toFixed(2);
  return `$${dollars}/session · ${scopeLabel(comp.scope).toLowerCase()}`;
}

// Sum of active rates across a team's staff, e.g. "$240/session committed".
// null when nothing is committed (all volunteers / no staff).
export function compSummary(staff) {
  const total = (staff || []).reduce((sum, s) => sum + (s.comp?.rateCents || 0), 0);
  if (total <= 0) return null;
  return `$${Math.round(total / 100)}/session committed`;
}

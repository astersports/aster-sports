// Role predicates — the single source of truth for "can this user do X?".
// Pages and nav components import these instead of string-comparing roles
// inline, so changing the role set later is a one-file edit.

export const isAdmin  = (role) => role === 'admin';
export const isCoach  = (role) => role === 'coach';
export const isParent = (role) => role === 'parent';

// Staff = admin or coach — both have write access to their team's data.
export const isStaff  = (role) => role === 'admin' || role === 'coach';

// canEdit is currently equivalent to isStaff, but kept as a separate name so
// call sites read more naturally and we can tighten the rule later without
// touching every page.
export const canEdit  = (role) => role === 'admin' || role === 'coach';

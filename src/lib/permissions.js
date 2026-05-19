// Role predicates — the single source of truth for "can this user do X?".
// Pages and nav components import these instead of string-comparing roles
// inline, so changing the role set later is a one-file edit.

export const isAdmin  = (role) => role === 'admin';

// Staff = admin or coach — both have write access to their team's data.
export const isStaff  = (role) => role === 'admin' || role === 'coach';

export const VIEW_AS_EXPIRY_HOURS = 24;

export const isViewAsExpired = (setAtIso) => {
  if (!setAtIso) return true;
  const setAt = new Date(setAtIso);
  if (Number.isNaN(setAt.getTime())) return true;
  const expiry = setAt.getTime() + VIEW_AS_EXPIRY_HOURS * 60 * 60 * 1000;
  return Date.now() > expiry;
};

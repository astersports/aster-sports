// REDIRECT_ALLOWLIST: UX-only gate for post-login navigation. NOT an
// auth boundary — all routes are RLS-gated at the data layer. This list
// expands to /admin/ broadly because admins are the heaviest re-login
// class (constantly in /admin/* tooling); narrow allowlist silently
// landed them at / and compounded across daily usage.
export const REDIRECT_ALLOWLIST = [
  '/events/',
  '/tournaments/',
  '/teams/',
  '/schedule',
  '/records',
  '/account',
  '/admin/',
  '/messages',
];

// Returns true if `path` is a safe post-login redirect target.
// Null/empty/non-string inputs return false (caller falls back to '/').
export function isAllowedRedirect(path) {
  if (!path || typeof path !== 'string') return false;
  return REDIRECT_ALLOWLIST.some((p) => path.startsWith(p));
}

// Resolves the post-login redirect destination from an intended path.
// Returns the intended path if allowlisted; otherwise '/'.
export function resolveLoginRedirect(intendedPath) {
  return isAllowedRedirect(intendedPath) ? intendedPath : '/';
}

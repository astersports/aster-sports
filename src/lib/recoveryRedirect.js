// Password-recovery landing guard.
//
// Supabase's GoTrue coerces a reset email's `redirect_to` to the project Site
// URL whenever the requested path isn't in the auth redirect allow-list. The
// result: reset links land at "/" (the app root) with the recovery token in the
// URL hash instead of at "/reset-password". "/" is a Protected route, so the
// app bounces to /login and the user never reaches the set-a-new-password form —
// the token verifies server-side but the flow dead-ends (Frank, 2026-06-30).
//
// This module runs at first import — main.jsx imports it before AuthContext (and
// therefore before the supabase client is constructed and detectSessionInUrl
// strips the hash) — and reroutes a recovery landing to /reset-password,
// preserving the token hash so the recovery session still establishes there.
// It is intentionally narrow: only an implicit-flow recovery hash (`type=recovery`)
// is rerouted, so magic-link sign-ins (`type=magiclink`, e.g. the Hub OTP) and
// password logins (no hash at all) are untouched.

// Pure: given the current path + hash, return the path+hash to replace to, or
// null when no reroute is needed. Exported for tests.
export function recoveryTarget(pathname, hash) {
  if (!hash || !hash.includes('type=recovery')) return null;
  if (pathname === '/reset-password') return null;
  return `/reset-password${hash}`;
}

// Side effect at import time (before the supabase client exists).
if (typeof window !== 'undefined' && window.history?.replaceState) {
  const target = recoveryTarget(window.location.pathname, window.location.hash);
  if (target) window.history.replaceState(null, '', target);
}

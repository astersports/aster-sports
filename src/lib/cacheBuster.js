// Central cache-clear registry. Hooks with module-level caches register
// their clear function here. AuthContext.signOut calls bustAllCaches()
// to prevent cross-account data bleed.
const registry = [];

export function registerCacheBuster(fn) { registry.push(fn); }

export function bustAllCaches() {
  for (const fn of registry) fn();
}

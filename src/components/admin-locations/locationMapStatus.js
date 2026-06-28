// Map-link correctness per CLAUDE.md §15 priority order:
//   1. location.google_maps_url (Frank-verified / admin-curated pin)
//   2. location.lat + location.lon (geocoded coordinates)
//   3. location.address (text fallback, encodeURIComponent)
//   else -> no usable map link ("Location TBD" non-link).
//
// Pure helper (no Date.now()/Math.random()) so it is safe in render and unit-
// testable. Returns { url, source } where source names which §15 tier resolved,
// or { url: null, source: 'none' } when nothing is usable.

export function resolveLocationMap(location) {
  const l = location || {};
  if (l.google_maps_url) return { url: l.google_maps_url, source: 'pin' };
  if (l.lat != null && l.lon != null) return { url: `https://maps.google.com/?q=${l.lat},${l.lon}`, source: 'coords' };
  if (l.address && l.address.trim()) {
    return { url: `https://maps.google.com/?q=${encodeURIComponent(l.address.trim())}`, source: 'address' };
  }
  return { url: null, source: 'none' };
}

// True when a venue has NO usable map link of any §15 tier — admin should add one.
export function isMapIncomplete(location) {
  return resolveLocationMap(location).source === 'none';
}

// Count venues missing a usable map link, for the completeness banner.
export function countMapIncomplete(locations) {
  return (locations || []).reduce((n, l) => (isMapIncomplete(l) ? n + 1 : n), 0);
}

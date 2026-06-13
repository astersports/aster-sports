// Pure URL builder for Apple/Google deep links.
// Priority: googleMapsUrl (Frank-verified) > coords > address text.
// Returns { google, apple } when navigable, else null.
// Waze removed 2026-06-13 (operator-directed): its name/address search
// mis-routed even with verified coords on Frank's device; complete removal.

export function getDirectionUrls(address, lat, lng, googleMapsUrl) {
  const trimmedAddr = address && address.trim ? address.trim() : null;
  const hasCoords = lat != null && lng != null;
  if (!googleMapsUrl && !hasCoords && !trimmedAddr) return null;

  const google = googleMapsUrl
    || (hasCoords
      ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(trimmedAddr)}`);

  const apple = hasCoords
    ? `https://maps.apple.com/?daddr=${lat},${lng}`
    : trimmedAddr ? `https://maps.apple.com/?daddr=${encodeURIComponent(trimmedAddr)}` : null;

  return { google, apple };
}

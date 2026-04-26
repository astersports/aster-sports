// Pure URL builder for Apple/Google/Waze deep links.
// Priority: googleMapsUrl (Frank-verified) > coords > address text.
// Returns { google, apple, waze } when navigable, else null.

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

  const waze = hasCoords
    ? `https://www.waze.com/ul?ll=${lat},${lng}&navigate=yes`
    : trimmedAddr ? `https://www.waze.com/ul?q=${encodeURIComponent(trimmedAddr)}&navigate=yes` : null;

  return { google, apple, waze };
}

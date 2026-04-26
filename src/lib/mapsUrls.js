// Pure URL builder for Apple/Google/Waze deep links.
// Prefers lat/lng when present, falls back to address text.
// Returns { google, apple, waze } when navigable, else null.

export function getDirectionUrls(address, lat, lng) {
  if (lat != null && lng != null) {
    return {
      google: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
      apple: `https://maps.apple.com/?q=${lat},${lng}`,
      waze: `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`,
    };
  }
  if (address && address.trim()) {
    const q = encodeURIComponent(address.trim());
    return {
      google: `https://www.google.com/maps/search/?api=1&query=${q}`,
      apple: `https://maps.apple.com/?q=${q}`,
      waze: `https://waze.com/ul?q=${q}&navigate=yes`,
    };
  }
  return null;
}

// Geocode an address via Nominatim (OpenStreetMap). Free, no API key required.
// Rate limit: 1 request/second per their ToS. Skyfire's usage stays well under.
// Returns { lat, lon } or null if not found / on error.

export async function geocodeAddress(address) {
  if (!address?.trim()) return null;
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address)}`;
    const res = await fetch(url, {
      headers: { 'Accept-Language': 'en' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data?.length) return null;
    return {
      lat: parseFloat(data[0].lat),
      lon: parseFloat(data[0].lon),
    };
  } catch (e) {
    console.warn('Geocoding failed:', e);
    return null;
  }
}

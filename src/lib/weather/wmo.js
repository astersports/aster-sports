// Single source for the WMO weather-code maps + the rain-label word.
// Imported by src/hooks/useWeather.js (hourly indicator) and
// src/lib/engine/resolvers/tournamentWeather.js (daily briefing strip) so
// the code->icon/label mapping lives in exactly ONE place — it was
// duplicated byte-for-byte across both modules (AP#42).

export const WMO_ICONS = {
  0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️',
  45: '🌫️', 48: '🌫️',
  51: '🌧️', 53: '🌧️', 55: '🌧️',
  61: '🌧️', 63: '🌧️', 65: '🌧️',
  71: '🌨️', 73: '🌨️', 75: '🌨️',
  80: '🌦️', 81: '🌦️', 82: '🌦️',
  95: '⛈️', 96: '⛈️', 99: '⛈️',
};

export const WMO_LABELS = {
  0: 'Clear', 1: 'Mostly clear', 2: 'Partly cloudy', 3: 'Overcast',
  45: 'Fog', 48: 'Fog', 51: 'Drizzle', 53: 'Drizzle', 55: 'Heavy drizzle',
  61: 'Rain', 63: 'Rain', 65: 'Heavy rain',
  71: 'Snow', 73: 'Snow', 75: 'Heavy snow',
  80: 'Showers', 81: 'Showers', 82: 'Heavy showers',
  95: 'Thunderstorm', 96: 'Thunderstorm', 99: 'Thunderstorm',
};

// Per-code rain-label word (mockup shows "55% storms" / "96% rain").
export function rainWord(code) {
  if (code >= 95) return 'storms';
  if (code >= 71 && code <= 77) return 'snow';
  return 'rain';
}

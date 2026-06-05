// tournament_prelim "gold standard" — weather strip data source.
//
// AP #27: resolvers are pure with INJECTED IO. This module is the
// injected weather fetcher — resolveTournamentPrelim accepts it via
// options.fetchWeather (defaulted to fetchTournamentWeather here) and
// the resolver puts the resulting per-day array onto context.weather.
// compose() then emits a pure `weather` section from context.weather.
// No top-level supabase import; the only IO is `fetch` (injected at
// the resolver boundary, stubbed in tests).
//
// Reuses the WMO code → emoji mapping shape established by
// src/hooks/useWeather.js, but reads the Open-Meteo DAILY endpoint
// (per-day temp max + precipitation_probability_max) rather than the
// hourly endpoint — the strip is a per-day forecast (FRI/SAT/SUN),
// matching docs/BRIEFING_FULL_PRESENTATION.html §2's .wx / .wxd.

const WMO_ICONS = {
  0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️',
  45: '🌫️', 48: '🌫️',
  51: '🌧️', 53: '🌧️', 55: '🌧️',
  61: '🌧️', 63: '🌧️', 65: '🌧️',
  71: '🌨️', 73: '🌨️', 75: '🌨️',
  80: '🌦️', 81: '🌦️', 82: '🌦️',
  95: '⛈️', 96: '⛈️', 99: '⛈️',
};

// Per-code rain-label word (mockup shows "55% storms" / "96% rain").
function rainWord(code) {
  if (code >= 95) return 'storms';
  if (code >= 71 && code <= 77) return 'snow';
  return 'rain';
}

const NY_TZ = 'America/New_York';
const dayFmt = new Intl.DateTimeFormat('en-US', { timeZone: NY_TZ, weekday: 'short' });
const mdFmt = new Intl.DateTimeFormat('en-US', { timeZone: NY_TZ, month: 'numeric', day: 'numeric' });

// Maps one Open-Meteo daily index to a .wxd row. day = "SAT 6/6",
// em = emoji, tp = "94°", rn = "55% storms".
function dayRow(iso, code, tempMax, rainPct) {
  const d = new Date(`${iso}T12:00:00Z`);
  const day = `${dayFmt.format(d).toUpperCase()} ${mdFmt.format(d)}`;
  return {
    day,
    em: WMO_ICONS[code] || '🌡️',
    tp: tempMax != null ? `${Math.round(tempMax)}°` : '—',
    rn: rainPct != null ? `${Math.round(rainPct)}% ${rainWord(code)}` : null,
  };
}

// Pure (apart from the injected `fetch`). Returns an array of per-day
// rows for [startDate, endDate] inclusive, or [] when coords/dates are
// missing or the fetch fails (NEVER fabricates — caller omits the
// section on []). fetchImpl defaults to global fetch; tests inject.
export async function fetchTournamentWeather({ lat, lon, startDate, endDate }, fetchImpl = (typeof fetch !== 'undefined' ? fetch : null)) {
  if (lat == null || lon == null || !startDate || !fetchImpl) return [];
  const end = endDate || startDate;
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}`
    + '&daily=weather_code,temperature_2m_max,precipitation_probability_max'
    + `&temperature_unit=fahrenheit&timezone=America%2FNew_York&start_date=${startDate}&end_date=${end}`;
  try {
    const res = await fetchImpl(url);
    const json = await res.json();
    const daily = json?.daily;
    if (!daily || !Array.isArray(daily.time) || !daily.time.length) return [];
    return daily.time.map((iso, i) => dayRow(
      iso,
      (daily.weather_code || [])[i],
      (daily.temperature_2m_max || [])[i],
      (daily.precipitation_probability_max || [])[i],
    ));
  } catch {
    return [];
  }
}

// Pick the forecast anchor: the first event-location (already sorted by
// the caller) carrying lat/lon. Returns { lat, lon, city } or null.
// City = address segment after the first comma (same heuristic as the
// venue-list city); falls back to the first segment or the venue name.
export function weatherLocationFrom(events, locations) {
  for (const ev of events || []) {
    const loc = locations[ev.location_id];
    if (loc && loc.lat != null && loc.lon != null) {
      const parts = loc.address ? String(loc.address).split(',').map((s) => s.trim()) : [];
      return { lat: loc.lat, lon: loc.lon, city: parts.length >= 2 ? parts[1] : (parts[0] || loc.name || null) };
    }
  }
  return null;
}

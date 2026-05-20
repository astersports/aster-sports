import { useEffect, useState } from 'react';
import { registerCacheBuster } from '../lib/cacheBuster';

const CACHE_PREFIX = 'ember-weather-cache:';
const FALLBACK_PREFIX = 'ember-weather-fallback:';
const CACHE_TTL = 30 * 60 * 1000;

// May 16 audit P2 #8 — register a signOut cache buster so the
// localStorage `ember-weather-fallback:<lat>,<lon>` entries (used as
// last-known-good fallback when the network call fails) clear on
// user signout. Weather data isn't user-PII, but consistent hygiene:
// signOut clears every per-user caching surface across the app.
registerCacheBuster(() => {
  try {
    const toRemove = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const k = localStorage.key(i);
      if (k && k.startsWith(FALLBACK_PREFIX)) toRemove.push(k);
    }
    for (const k of toRemove) localStorage.removeItem(k);
  } catch { /* quota / disabled storage / SSR */ }
});

// Beta B4 audit fix — cache key must include lat/lon. Prior global key
// caused stale weather for one venue to render at another venue within
// the 30-min TTL.
function cacheKeyFor(lat, lon) {
  return `${CACHE_PREFIX}${lat.toFixed(3)},${lon.toFixed(3)}`;
}
function fallbackKeyFor(lat, lon) {
  return `${FALLBACK_PREFIX}${lat.toFixed(3)},${lon.toFixed(3)}`;
}

const WMO_ICONS = {
  0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️',
  45: '🌫️', 48: '🌫️',
  51: '🌧️', 53: '🌧️', 55: '🌧️',
  61: '🌧️', 63: '🌧️', 65: '🌧️',
  71: '🌨️', 73: '🌨️', 75: '🌨️',
  80: '🌦️', 81: '🌦️', 82: '🌦️',
  95: '⛈️', 96: '⛈️', 99: '⛈️',
};

const WMO_LABELS = {
  0: 'Clear', 1: 'Mostly clear', 2: 'Partly cloudy', 3: 'Overcast',
  45: 'Fog', 48: 'Fog', 51: 'Drizzle', 53: 'Drizzle', 55: 'Heavy drizzle',
  61: 'Rain', 63: 'Rain', 65: 'Heavy rain',
  71: 'Snow', 73: 'Snow', 75: 'Heavy snow',
  80: 'Showers', 81: 'Showers', 82: 'Heavy showers',
  95: 'Thunderstorm', 96: 'Thunderstorm', 99: 'Thunderstorm',
};

export function useWeather(lat, lon) {
  const [weather, setWeather] = useState(null);

  useEffect(() => {
    if (!lat || !lon) return;
    const cacheKey = cacheKeyFor(lat, lon);
    const fallbackKey = fallbackKeyFor(lat, lon);
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Date.now() - parsed.ts < CACHE_TTL) { Promise.resolve().then(() => setWeather(parsed.data)); return; }
      } catch { /* ignore */ }
    }
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,weather_code&temperature_unit=fahrenheit&timezone=America%2FNew_York&forecast_days=7`;
    fetch(url).then((r) => r.json()).then((json) => {
      if (!json.hourly) return;
      const codes = json.hourly.weather_code || json.hourly.weathercode;
      if (!codes) return;
      const hours = json.hourly.time.map((t, i) => ({
        time: t,
        temp: Math.round(json.hourly.temperature_2m[i]),
        code: codes[i],
        icon: WMO_ICONS[codes[i]] || '🌡️',
        label: WMO_LABELS[codes[i]] || 'Unknown',
      }));
      const data = { hours, fetchedAt: Date.now() };
      sessionStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), data }));
      try { localStorage.setItem(fallbackKey, JSON.stringify(data)); } catch { /* quota */ }
      setWeather(data);
    }).catch(() => {
      try {
        const fallback = localStorage.getItem(fallbackKey);
        if (fallback) setWeather(JSON.parse(fallback));
      } catch { /* ignore */ }
    });
  }, [lat, lon]);

  return weather;
}

export function getWeatherForTime(weather, isoTime) {
  if (!weather?.hours || !isoTime) return null;
  const target = new Date(isoTime);
  if (isNaN(target.getTime())) return null;
  const closest = weather.hours.reduce((best, h) => {
    const diff = Math.abs(new Date(h.time) - target);
    return diff < best.diff ? { ...h, diff } : best;
  }, { diff: Infinity });
  return closest.diff < 2 * 60 * 60 * 1000 ? closest : null;
}

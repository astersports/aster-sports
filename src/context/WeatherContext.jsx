import { createContext, useContext, useMemo } from 'react';
import { getWeatherForTime as matchHour, useWeather } from '../hooks/useWeather';
import { fetchTournamentWeather } from '../lib/engine/resolvers/tournamentWeather';
import { coordsForEvent } from '../lib/weather/coordsForEvent';
import { WEATHER_DEFAULT_COORDS } from '../lib/constants';
import { useAuth } from './AuthContext';

// PR-1 weather foundation: ONE useWeather call set for the whole
// authenticated app, replacing the per-page fan-out (5 consumers each
// called useWeather(...WEATHER_DEFAULT_COORDS); the sessionStorage cache
// deduped them, so this is fewer fetches, no behavior loss).
//
// Coords resolve through coordsForEvent so the source is the event-location
// seam, not a hardcoded constant. PR-1 passes NO anchor (default coords —
// behavior-exact); a later PR feeds anchorEvents for true per-venue weather.
// Gated on auth so login/public routes never fire a weather fetch.

const WeatherContext = createContext({
  weather: null,
  getWeatherForTime: matchHour,
  fetchDaily: async () => [],
});

export function WeatherProvider({ children, anchorEvents = null, anchorLocations = null }) {
  const { user } = useAuth();
  const [lat, lon] = user
    ? coordsForEvent(anchorEvents, anchorLocations, WEATHER_DEFAULT_COORDS)
    : [null, null];
  const weather = useWeather(lat, lon);
  const value = useMemo(() => ({
    weather,
    getWeatherForTime: matchHour,
    // Daily forecast (per-day temp max + precip%), for the rain banner. Pure
    // apart from the injected global fetch (AP#27); resolves to [] on failure.
    fetchDaily: (startDate, endDate) => fetchTournamentWeather({ lat, lon, startDate, endDate }),
  }), [weather, lat, lon]);
  return <WeatherContext.Provider value={value}>{children}</WeatherContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useWeatherContext() {
  return useContext(WeatherContext);
}

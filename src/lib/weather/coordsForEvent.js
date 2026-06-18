import { WEATHER_DEFAULT_COORDS } from '../constants';
import { weatherLocationFrom } from '../engine/resolvers/tournamentWeather';

// Resolve the weather-anchor coords for a set of events. Returns the first
// event-location carrying lat/lon (via the shared weatherLocationFrom
// picker), else the org default. This is the seam that closes the
// org-agnostic-coords default (AP#7): the source is real event locations,
// with WEATHER_DEFAULT_COORDS only as the fallback — not a hardcoded
// Westchester constant baked into every consumer.
//
// Returns a [lat, lon] tuple to spread straight into useWeather(lat, lon).
// `events` null/empty or no event-location coords => orgDefault.
export function coordsForEvent(events, locations, orgDefault = WEATHER_DEFAULT_COORDS) {
  const anchor = weatherLocationFrom(events || [], locations || {});
  return anchor ? [anchor.lat, anchor.lon] : orgDefault;
}

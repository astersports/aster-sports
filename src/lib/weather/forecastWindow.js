import { WEATHER_FORECAST_WINDOW_DAYS } from '../constants';

// The parish "next event within N days" rule, expressed as one pure,
// testable function (R-6 / Manus PR-4 spec). True when isoTime is in
// [now, now + days]; false for past times, beyond the window, or an
// invalid date. No IO.
//
// Note: the hourly indicator self-limits to its ~7-day Open-Meteo coverage
// and returns null beyond that regardless — this does NOT fabricate past
// coverage. The window just bounds WHEN we bother surfacing weather UX
// (and gates the daily rain banner, whose daily forecast reaches further).
export function isWithinForecastWindow(isoTime, nowMs = Date.now(), days = WEATHER_FORECAST_WINDOW_DAYS) {
  const t = new Date(isoTime).getTime();
  if (Number.isNaN(t)) return false;
  return t >= nowMs && t <= nowMs + days * 24 * 60 * 60 * 1000;
}

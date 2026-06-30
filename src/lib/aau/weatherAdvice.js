// Game-day weather advice for the no-login Hub up-next hero (R1·PR-A). Pure:
// maps an Open-Meteo hour ({ temp °F, code WMO }) to one short, parent-facing
// line ("Bring water + shade", "Rain likely — pack a poncho"). Mirrors the
// authenticated app's AI game-day brief tone without an LLM call — deterministic
// so it renders instantly and identically. Returns null when no hour is known
// so the hero can omit the line rather than fabricate (resolver no-fab rule).

// WMO weather_code groups (Open-Meteo): 0 clear · 1-3 mainly clear→overcast ·
// 45/48 fog · 51-67 drizzle/rain · 71-77 snow · 80-82 rain showers ·
// 85/86 snow showers · 95-99 thunderstorm.
export function weatherAdvice(hour) {
  if (!hour || typeof hour.temp !== 'number') return null;
  const { temp, code } = hour;

  if (code >= 95) return 'Storms possible — watch for delays';
  if (code >= 71 && code <= 77) return 'Snow — dress warm';
  if (code === 85 || code === 86) return 'Snow showers — dress warm';
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return 'Rain likely — pack a poncho';

  if (temp >= 85) return 'Hot — bring water + shade';
  if (temp <= 38) return 'Cold — bring layers';
  if (temp <= 50) return 'Cool — bring a layer';
  return 'Looks comfortable';
}

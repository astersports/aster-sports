import { useEffect, useState } from 'react';
import { CloudLightning, CloudRain, CloudSnow, X } from 'lucide-react';
import { useWeatherContext } from '../../context/WeatherContext';
import { parsePrecip } from '../../lib/weather/parsePrecip';
import { isWithinForecastWindow } from '../../lib/weather/forecastWindow';
import { RAIN_BANNER_THRESHOLD_PCT } from '../../lib/constants';

// R-4/R-5 (tokens corrected per VF-1): a friendly, dismissible precipitation
// heads-up for the NEXT upcoming event — rain, SNOW, or storms (snow is the
// bigger driving impact, per Frank). Info tier only (var(--as-info-soft) /
// var(--as-info), the shipped SEVERITY_TOKENS.info palette), never an alarm.
// Home-only, next event only, >= threshold, session-dismissible by event id.
// Never fabricates: no event / out of window / no daily forecast / under
// threshold / dismissed => renders nothing. Mounted with key={event.id} so a
// new next-event remounts it with fresh state (no reset-in-effect).
const COPY = {
  snow:   { Icon: CloudSnow,      word: 'snow',   tail: 'Leave a little early for the drive.' },
  storms: { Icon: CloudLightning, word: 'storms', tail: 'Plan a little extra time.' },
  rain:   { Icon: CloudRain,      word: 'rain',   tail: 'Might want to plan the drive.' },
};

export default function RainAlertBanner({ event }) {
  const { fetchDaily } = useWeatherContext();
  const eventId = event?.id;
  const startAt = event?.start_at;
  const inWindow = !!startAt && isWithinForecastWindow(startAt);
  const [precip, setPrecip] = useState(null);
  const [dismissed, setDismissed] = useState(() => {
    try { return !!(eventId && sessionStorage.getItem(`rainbanner:dismissed:${eventId}`)); } catch { return false; }
  });

  useEffect(() => {
    if (!inWindow || dismissed) return undefined;
    let active = true;
    const day = String(startAt).slice(0, 10);
    fetchDaily(day, day)
      .then((rows) => { if (active) setPrecip(parsePrecip(rows?.[0]?.rn)); })
      .catch(() => { if (active) setPrecip(null); });
    return () => { active = false; };
  }, [inWindow, dismissed, startAt, fetchDaily]);

  if (!inWindow || dismissed || !precip || precip.pct == null || precip.pct < RAIN_BANNER_THRESHOLD_PCT) return null;

  const { Icon, word, tail } = COPY[precip.kind] || COPY.rain;
  const day = new Date(startAt).toLocaleDateString('en-US', { weekday: 'long', timeZone: 'America/New_York' });
  const dismiss = () => {
    try { sessionStorage.setItem(`rainbanner:dismissed:${eventId}`, '1'); } catch { /* ignore */ }
    setDismissed(true);
  };

  return (
    <div role="status" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 12px', backgroundColor: 'var(--as-info-soft)', borderLeft: '3px solid var(--as-info)', borderRadius: 10 }}>
      <Icon size={20} strokeWidth={1.75} color="var(--as-info)" aria-hidden="true" style={{ flexShrink: 0 }} />
      <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: 'var(--as-text-primary)', lineHeight: 1.4 }}>
        Looks like {word} {day}. {tail}
      </span>
      <button
        type="button" onClick={dismiss} aria-label="Dismiss weather notice" className="as-press"
        style={{ flexShrink: 0, border: 'none', background: 'none', cursor: 'pointer', minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--as-text-tertiary)', margin: '-11px -8px -11px 0' }}
      >
        <X size={18} strokeWidth={2} aria-hidden="true" />
      </button>
    </div>
  );
}

import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useActivities } from '../../hooks/useActivities';
import { useNow } from '../../hooks/useNow';
import { getWeatherForTime, useWeather } from '../../hooks/useWeather';
import TextEmptyState from '../shared/TextEmptyState';
import EventCard from '../schedule/EventCard';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_EVENTS = 5;

export default function UpcomingEvents({ teamId }) {
  const { activities } = useActivities();
  const navigate = useNavigate();
  const now = useNow();
  const weather = useWeather(41.03, -73.76);

  const upcoming = useMemo(() => {
    if (!teamId) return [];
    const cutoff = now + SEVEN_DAYS_MS;
    return activities
      .filter((e) => {
        if (e.team_id !== teamId) return false;
        if (e.status === 'cancelled') return false;
        if (!e.start_at) return false;
        const t = new Date(e.start_at).getTime();
        return t >= now && t <= cutoff;
      })
      .slice(0, MAX_EVENTS);
  }, [activities, teamId, now]);

  // 2026-05-21 (Teams PR C) — CTA dropped from body in favor of an inline
  // link (lighter visual weight). The section header CollapsibleSection
  // already conveys "Upcoming · {n} events" so the heavy 44px outlined
  // button was redundant. Empty-state microcopy warmed per §16.3 — strings
  // remain translation-extractable per §16.6.
  return (
    <div style={{ padding: '4px 16px 12px' }}>
      {upcoming.length === 0 ? (
        <TextEmptyState
          heading="No events here yet"
          message="But Coach Kenny is plotting something good."
        />
      ) : (
        <>
          {upcoming.map((evt, i) => (
            <div key={evt.id} style={{ marginBottom: i < upcoming.length - 1 ? 6 : 0 }}>
              <EventCard event={evt} density="minimal" weather={getWeatherForTime(weather, evt.start_at)} />
            </div>
          ))}
          <button type="button" onClick={() => { navigator.vibrate?.(10); navigate(`/schedule?team=${teamId}`); }}
            className="sf-press" aria-label="View full schedule for this team"
            style={{ marginTop: 6, minHeight: 44, padding: '0 4px',
              border: 'none', background: 'none', color: 'var(--em-accent)',
              fontSize: 13, fontWeight: 500 }}>
            View full schedule →
          </button>
        </>
      )}
    </div>
  );
}


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

  return (
    <div style={{ marginTop: 24 }}>
      <div style={{
        fontSize: 11, fontWeight: 600, letterSpacing: '0.05em',
        textTransform: 'uppercase', color: 'var(--em-text-tertiary)', marginBottom: 8,
      }}>UPCOMING (NEXT 7 DAYS)</div>
      {upcoming.length === 0 ? (
        <TextEmptyState heading="Clear week ahead" message="Time to work on those crossovers." />
      ) : (
        upcoming.map((evt, i) => (
          <div key={evt.id} style={{ marginBottom: i < upcoming.length - 1 ? 6 : 0 }}>
            <EventCard event={evt} density="minimal" weather={getWeatherForTime(weather, evt.start_at)} />
          </div>
        ))
      )}
      <button type="button" onClick={() => { navigator.vibrate?.(10); navigate(`/schedule?team=${teamId}`); }}
        className="w-full sf-press" style={{ marginTop: 8, minHeight: 44, borderRadius: 10,
          border: '1px solid var(--em-border-default)', backgroundColor: 'var(--em-bg-card)',
          color: 'var(--em-accent)', fontSize: 15, fontWeight: 500 }}>
        View full schedule →
      </button>
    </div>
  );
}

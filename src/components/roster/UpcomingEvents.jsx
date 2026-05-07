import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { useActivities } from '../../hooks/useActivities';
import { useNow } from '../../hooks/useNow';
import { getWeatherForTime, useWeather } from '../../hooks/useWeather';
import { useMapsUrl } from '../../hooks/useMapsUrl';
import { useDensity } from '../../hooks/useDensity';
import DensityToggle from '../home/DensityToggle';
import TextEmptyState from '../shared/TextEmptyState';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_EVENTS = 5;

function formatRow(event) {
  const dt = new Date(event.start_at);
  const dateStr = dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const timeStr = dt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  const label = event.event_type === 'game' || event.event_type === 'tournament'
    ? (event.opponent ? `vs ${event.opponent}` : (event.title || 'Game'))
    : (event.title || event.event_type);
  return { label, dateStr, timeStr, location: event.location || '' };
}

export default function UpcomingEvents({ teamId }) {
  const { activities } = useActivities();
  const navigate = useNavigate();
  const now = useNow();
  const weather = useWeather(41.03, -73.76);
  const { density } = useDensity('team-upcoming', 'medium');

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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{
          fontSize: 11, fontWeight: 600, letterSpacing: '0.05em',
          textTransform: 'uppercase', color: 'var(--em-text-tertiary)',
        }}>UPCOMING (NEXT 7 DAYS)</div>
        <DensityToggle sectionKey="team-upcoming" />
      </div>
      {upcoming.length === 0 ? (
        <TextEmptyState heading="Nothing this week" message="No events scheduled in the next 7 days." />
      ) : (
        <div style={{
          backgroundColor: 'var(--em-bg-card)', borderRadius: 10,
          border: '1px solid var(--em-border-default)', boxShadow: 'var(--em-shadow-sm)', overflow: 'hidden',
        }}>
          {upcoming.map((evt, i) => (
            <UpcomingRow key={evt.id} evt={evt} i={i} total={upcoming.length} weather={weather} navigate={navigate} density={density} />
          ))}
        </div>
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

function UpcomingRow({ evt, i, total, weather, navigate, density }) {
  const { label, dateStr, timeStr, location } = formatRow(evt);
  const mapsUrl = useMapsUrl(location || null);
  const showLocation = density !== 'minimal';
  const showWeather = density !== 'minimal';
  const showTimeBold = density === 'maximum';
  const pad = density === 'minimal' ? '8px 16px' : '12px 16px';
  const minH = density === 'minimal' ? 44 : 52;
  const w = getWeatherForTime(weather, evt.start_at);
  return (
    <button type="button" className="sf-press" onClick={() => { navigator.vibrate?.(10); navigate(`/events/${evt.id}`); }}
      style={{ width: '100%', padding: pad, background: 'none', border: 'none', fontFamily: 'inherit', textAlign: 'left',
        borderBottom: i < total - 1 ? '1px solid var(--em-border-subtle)' : 'none',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: minH }}>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div className="flex items-center gap-2">
          {showTimeBold && <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--em-accent)' }}>{timeStr} ·</span>}
          <span className="font-semibold" style={{ fontSize: 15, color: 'var(--em-text-primary)' }}>{label}</span>
          {showWeather && w && <span style={{ fontSize: 12, color: 'var(--em-text-tertiary)' }}>{w.icon} {w.temp}°</span>}
        </div>
        <div className="flex items-center gap-1" style={{ fontSize: 13, color: 'var(--em-text-tertiary)', marginTop: 2 }}>
          <span>{dateStr}</span>
          {showLocation && location && (
            <>
              <span>·</span>
              {mapsUrl ? (
                <button type="button" onClick={(e) => { e.stopPropagation(); window.open(mapsUrl, '_blank', 'noopener,noreferrer'); }}
                  style={{ color: 'var(--em-accent)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 2, background: 'none', border: 'none', padding: 0, font: 'inherit', cursor: 'pointer' }}>
                  <MapPin size={11} strokeWidth={1.75} /> {location}
                </button>
              ) : <span>{location}</span>}
            </>
          )}
        </div>
      </div>
      <span className="font-semibold" style={{ fontSize: 15, color: 'var(--em-text-primary)', marginLeft: 12, flexShrink: 0 }}>{timeStr}</span>
    </button>
  );
}

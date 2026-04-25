import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useActivities } from '../../hooks/useActivities';
import { useNow } from '../../hooks/useNow';
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

// Real upcoming events for a single team. Pulls from useActivities (org-scoped),
// filters to (team_id matches, start_at in [now, now+7d], status != cancelled),
// takes the first MAX_EVENTS in chronological order. Empty state if none in window.
//
// TODO: when admin publish workflow ships, also filter publish_status='published'
// for parent role. All current events are draft so a published-only filter would
// show nothing right now.
export default function UpcomingEvents({ teamId }) {
  const { activities } = useActivities();
  const navigate = useNavigate();
  const now = useNow();

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
        textTransform: 'uppercase', color: 'var(--sf-text-tertiary)', marginBottom: 8,
      }}>UPCOMING (NEXT 7 DAYS)</div>
      {upcoming.length === 0 ? (
        <TextEmptyState heading="Nothing this week" message="No events scheduled in the next 7 days." />
      ) : (
        <div style={{
          backgroundColor: 'var(--sf-bg-card)',
          borderRadius: 10,
          border: '1px solid var(--sf-border-default)',
          boxShadow: 'var(--sf-shadow-sm)',
          overflow: 'hidden',
        }}>
          {upcoming.map((evt, i) => {
            const { label, dateStr, timeStr, location } = formatRow(evt);
            return (
              <div
                key={evt.id}
                className="sf-press"
                onClick={() => navigator.vibrate?.(10)}
                style={{
                  padding: '12px 16px',
                  borderBottom: i < upcoming.length - 1 ? '1px solid var(--sf-border-subtle)' : 'none',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: 52,
                }}
              >
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="font-semibold" style={{ fontSize: 14, color: 'var(--sf-text-primary)' }}>{label}</div>
                  <div style={{ fontSize: 12, color: 'var(--sf-text-tertiary)', marginTop: 2 }}>
                    {dateStr}{location ? ` · ${location}` : ''}
                  </div>
                </div>
                <div className="font-semibold" style={{ fontSize: 14, color: 'var(--sf-text-primary)', marginLeft: 12, flexShrink: 0 }}>
                  {timeStr}
                </div>
              </div>
            );
          })}
        </div>
      )}
      <button
        type="button"
        onClick={() => { navigator.vibrate?.(10); navigate(`/schedule?team=${teamId}`); }}
        className="w-full sf-press"
        style={{
          marginTop: 8, minHeight: 44, borderRadius: 10,
          border: '1px solid var(--sf-border-default)', backgroundColor: 'var(--sf-bg-card)',
          color: 'var(--sf-accent)', fontSize: 14, fontWeight: 500,
        }}
      >
        View full schedule →
      </button>
    </div>
  );
}

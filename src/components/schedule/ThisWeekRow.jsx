// src/components/schedule/ThisWeekRow.jsx
// Tactical row for the parent NEXT 48 HOURS section. Surfaces ride/duty
// status, completion + cancellation, time conflicts with another visible
// event, and inline RSVP for each child on this team. Pills fast-path tap
// to /events/{id}?tab={rides|duties}; row body taps to event detail.
import { useNavigate } from 'react-router-dom';
import { Car, Users, MapPin } from 'lucide-react';
import { TYPE_LABELS } from '../../lib/constants';
import { formatTime, formatCountdown } from '../../lib/formatters';
import { useAuth } from '../../context/AuthContext';
import { useNow } from '../../hooks/useNow';
import { urgencyClass } from '../../lib/urgency';
import { useMapsUrl } from '../../hooks/useMapsUrl';
import ChildRsvp from './ChildRsvp';

const PILL = { display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 500, padding: '2px 6px', borderRadius: 8 };
const WARN = { ...PILL, backgroundColor: 'var(--em-warning-soft)', color: 'var(--em-warning)' };
const OK   = { ...PILL, backgroundColor: 'var(--em-success-soft)', color: 'var(--em-success)' };
const NEG  = { ...PILL, backgroundColor: 'var(--em-danger-soft)',  color: 'var(--em-danger)' };

export default function ThisWeekRow({ event, rideCount, dutyCount, conflictWith, weather }) {
  const navigate = useNavigate();
  const now = useNow();
  const { myChildren } = useAuth();
  const mapsUrl = useMapsUrl(event.location || null);
  const childrenOnTeam = (myChildren || []).filter((c) => c.teamIds?.includes(event.team_id) || c.teamId === event.team_id);
  const teamColor = event.teams?.team_color || 'var(--em-text-tertiary)';
  const teamName = event.teams?.name || event.team_name || '';
  const teamAbbr = teamName.split(' ')[0] || teamName;
  const typeLabel = TYPE_LABELS[event.event_type] || event.event_type;
  const titleText = event.title || `${teamName} ${typeLabel}`.trim();

  const startMs = new Date(event.start_at).getTime();
  const endMs = event.end_at ? new Date(event.end_at).getTime() : startMs + 90 * 60 * 1000;
  const secondsUntil = (startMs - now) / 1000;
  const isCancelled = event.status === 'cancelled';
  const isCompleted = !isCancelled && endMs < now;
  const opacity = isCancelled ? 0.4 : isCompleted ? 0.6 : 1;
  const within24h = secondsUntil > 0 && secondsUntil < 86400;
  const timeText = within24h ? formatCountdown(event.start_at) : formatTime(event.start_at);

  const goTo = (e, path) => { e.stopPropagation(); navigator.vibrate?.(10); navigate(path, { state: { event } }); };
  const onRowClick = (e) => {
    if (e.target.closest('button, a, [role="link"], [role="button"]')) return;
    navigator.vibrate?.(10);
    navigate(`/events/${event.id}`, { state: { event } });
  };

  const ridePill = rideCount?.requests > 0 ? <span style={WARN}><Car size={10} strokeWidth={1.75} /> Need ride</span>
    : rideCount?.offers > 0 ? <span style={OK}><Car size={10} strokeWidth={1.75} /> Seat open</span>
    : null;
  const open = (dutyCount?.total ?? 0) - (dutyCount?.claimed ?? 0);
  const dutyPill = dutyCount?.total > 0 && open > 0
    ? <span style={WARN}><Users size={10} strokeWidth={1.75} /> Volunteer</span> : null;

  return (
    <div onClick={onRowClick} role="link" tabIndex={0}
      aria-label={`${teamName} ${typeLabel}, ${timeText}`}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onRowClick(e); } }}
      style={{ display: 'flex', minHeight: 56, backgroundColor: 'var(--em-bg-card)', borderRadius: 8, border: '1px solid var(--em-border-default)', overflow: 'hidden', cursor: 'pointer', opacity, transition: 'box-shadow 150ms ease-out, opacity 150ms ease-out' }}>
      <div style={{ width: 4, alignSelf: 'stretch', flexShrink: 0, backgroundColor: teamColor }} />
      <div style={{ flex: 1, padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <span className={`sf-countdown ${urgencyClass(secondsUntil)}`.trim()}
            style={{ fontSize: 13, fontWeight: 700, minWidth: 56, fontVariantNumeric: 'tabular-nums' }}>{timeText}</span>
          <span style={{ fontSize: 11, fontWeight: 700, padding: '1px 5px', borderRadius: 4, backgroundColor: teamColor, color: 'var(--em-text-inverse)', flexShrink: 0 }}>{teamAbbr}</span>
          <span className="truncate" style={{ flex: 1, fontSize: 13, color: 'var(--em-text-secondary)', minWidth: 0 }}>{titleText}</span>
          {weather && <span style={{ fontSize: 11, color: 'var(--em-text-tertiary)', flexShrink: 0 }}>{weather.icon} {weather.temp}°</span>}
        </div>
        {event.location && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: 'var(--em-text-tertiary)' }}>
            <MapPin size={10} strokeWidth={1.75} />
            {mapsUrl ? (
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
                style={{ color: 'var(--em-accent)', textDecoration: 'none', fontSize: 11 }}>{event.location}</a>
            ) : <span>{event.location}</span>}
          </div>
        )}
        {(isCompleted || isCancelled || ridePill || dutyPill) && (
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
            {isCancelled && <span style={NEG}>✕ Cancelled</span>}
            {isCompleted && <span style={{ ...PILL, backgroundColor: 'var(--em-bg-tertiary)', color: 'var(--em-text-secondary)' }}>✓ Completed</span>}
            {ridePill && <button type="button" onClick={(e) => goTo(e, `/events/${event.id}?tab=rides`)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>{ridePill}</button>}
            {dutyPill && <button type="button" onClick={(e) => goTo(e, `/events/${event.id}?tab=duties`)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>{dutyPill}</button>}
          </div>
        )}
        {conflictWith && (
          <div style={{ fontSize: 11, color: 'var(--em-danger)', fontWeight: 500 }}>
            ⚠ Conflicts with {conflictWith.teamName} at {conflictWith.startTime}
          </div>
        )}
        {!isCancelled && !isCompleted && childrenOnTeam.map((c) => (
          <ChildRsvp key={c.playerId} child={c} eventId={event.id} compact={true} />
        ))}
      </div>
    </div>
  );
}

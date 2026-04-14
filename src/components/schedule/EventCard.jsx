import { MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatTime } from '../../lib/formatters';

const TYPE_LABELS = { practice: 'Practice', game: 'Game', skills_lab: 'Skills Lab', tryout: 'Tryout', tournament: 'Tournament', other: 'Event' };

export default function EventCard({ event, rsvpCount, stagger }) {
  const navigate = useNavigate();
  const team = event.teams;
  const teamColor = team?.team_color || 'var(--sf-neutral)';
  const teamName = team?.name || '';
  const typeLabel = TYPE_LABELS[event.event_type] || event.event_type;
  const isGame = event.event_type === 'game';
  const isPast = event.start_at && new Date(event.start_at) < new Date();

  return (
    <div
      className={`sf-press ${stagger || ''}`}
      onClick={() => { navigator.vibrate?.(10); navigate(`/events/${event.id}`); }}
      style={{
        display: 'flex',
        alignItems: 'stretch',
        backgroundColor: isGame ? `${teamColor}08` : 'var(--sf-bg-card)',
        borderRadius: 10,
        border: '1px solid var(--sf-border-default)',
        boxShadow: 'var(--sf-shadow-sm)',
        overflow: 'hidden',
        opacity: isPast ? 0.5 : 1,
        transition: 'box-shadow 150ms ease-out, transform 150ms ease-out, opacity 150ms ease-out',
      }}
    >
      <div style={{ width: 4, flexShrink: 0, backgroundColor: teamColor }} />
      <div style={{ flex: 1, padding: '10px 14px' }}>
        {/* Row 1: Time · Type */}
        <div style={{ marginBottom: 4 }}>
          <span className="font-bold" style={{ fontSize: 17, color: 'var(--sf-text-primary)' }}>
            {formatTime(event.start_time || '00:00')}
          </span>
          <span style={{ fontSize: 13, color: 'var(--sf-text-tertiary)', marginLeft: 6 }}>
            · {typeLabel}
          </span>
        </div>
        {/* Row 2: Title */}
        <div style={{ fontSize: 15, color: 'var(--sf-text-primary)', marginBottom: 2 }}>
          {event.title || typeLabel}
        </div>
        {/* Row 3: Team · pin Location */}
        {(teamName || event.location_name) && (
          <div className="flex items-center" style={{ fontSize: 13, gap: 4 }}>
            {teamName && <span style={{ color: teamColor, fontWeight: 500 }}>{teamName}</span>}
            {teamName && event.location_name && <span style={{ color: 'var(--sf-text-tertiary)' }}>·</span>}
            {event.location_name && (
              <>
                <MapPin size={12} strokeWidth={1.75} color="var(--sf-text-tertiary)" />
                <span style={{ color: 'var(--sf-text-tertiary)' }}>{event.location_name}</span>
              </>
            )}
          </div>
        )}
        {/* Row 4: RSVP counts (only if any response recorded) */}
        {rsvpCount && (rsvpCount.going + rsvpCount.not_going + rsvpCount.maybe) > 0 && (
          <div className="flex items-center" style={{ fontSize: 12, gap: 8, marginTop: 4, color: 'var(--sf-text-tertiary)' }}>
            <Dot color="var(--sf-success)" />{rsvpCount.going} going
            <Dot color="var(--sf-danger)" />{rsvpCount.not_going} not going
            {rsvpCount.noResponse > 0 && <><Dot color="var(--sf-neutral)" />{rsvpCount.noResponse} no response</>}
          </div>
        )}
      </div>
    </div>
  );
}

function Dot({ color }) {
  return <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: 3, backgroundColor: color, marginRight: 2 }} />;
}

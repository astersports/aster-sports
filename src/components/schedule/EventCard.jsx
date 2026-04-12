import { formatTime } from '../../lib/formatters';

export default function EventCard({ event, stagger }) {
  const team = event.teams;
  const teamColor = team?.team_color || 'var(--sf-neutral)';
  const teamName = team?.name || '';
  const typeBadge = (event.event_type || 'event').toUpperCase();
  const isGame = event.event_type === 'game';

  return (
    <div
      className={`sf-press ${stagger || ''}`}
      onClick={() => navigator.vibrate?.(10)}
      style={{
        display: 'flex',
        alignItems: 'stretch',
        backgroundColor: isGame ? `${teamColor}08` : 'var(--sf-bg-card)',
        borderRadius: 10,
        border: '1px solid var(--sf-border-default)',
        boxShadow: 'var(--sf-shadow-sm)',
        overflow: 'hidden',
        transition: 'box-shadow 150ms ease-out, transform 150ms ease-out',
      }}
    >
      <div style={{ width: 4, flexShrink: 0, backgroundColor: teamColor }} />
      <div style={{ flex: 1, padding: '10px 14px' }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
          <span className="font-bold" style={{ fontSize: 17, color: 'var(--sf-text-primary)' }}>
            {formatTime(event.start_time || '00:00')}
          </span>
          <div className="flex items-center gap-2">
            <span style={{
              fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 4,
              backgroundColor: teamColor, color: 'var(--sf-text-inverse)',
            }}>{teamName}</span>
            <span style={{
              fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 4,
              backgroundColor: 'var(--sf-bg-secondary)', color: 'var(--sf-text-tertiary)',
              letterSpacing: '0.05em',
            }}>{typeBadge}</span>
          </div>
        </div>
        <div style={{ fontSize: 14, color: 'var(--sf-text-primary)', marginBottom: 2 }}>
          {event.title || event.event_type || 'Event'}
        </div>
        {event.location_name && (
          <div style={{ fontSize: 13, color: 'var(--sf-text-tertiary)' }}>
            📍 {event.location_name}
          </div>
        )}
      </div>
    </div>
  );
}

import { formatTime } from '../../lib/formatters';

export default function CompactCard({ event, stagger }) {
  const team = event.teams;
  const teamColor = team?.team_color || 'var(--sf-neutral)';
  const teamName = team?.name || '';

  return (
    <div
      className={`sf-press ${stagger || ''}`}
      onClick={() => navigator.vibrate?.(10)}
      style={{
        display: 'flex',
        alignItems: 'center',
        minHeight: 48,
        backgroundColor: 'var(--sf-bg-card)',
        borderRadius: 8,
        border: '1px solid var(--sf-border-default)',
        overflow: 'hidden',
        transition: 'box-shadow 150ms ease-out',
      }}
    >
      <div style={{ width: 3, alignSelf: 'stretch', flexShrink: 0, backgroundColor: teamColor }} />
      <div className="flex items-center flex-1 gap-3" style={{ padding: '6px 12px' }}>
        <span className="font-bold" style={{ fontSize: 14, color: 'var(--sf-text-primary)', minWidth: 56 }}>
          {formatTime(event.start_time || '00:00')}
        </span>
        <span style={{
          fontSize: 10, fontWeight: 600, padding: '1px 5px', borderRadius: 4,
          backgroundColor: teamColor, color: 'var(--sf-text-inverse)',
        }}>{teamName}</span>
        <span className="truncate" style={{ flex: 1, fontSize: 13, color: 'var(--sf-text-secondary)' }}>
          {event.title || event.event_type || 'Event'}
        </span>
      </div>
    </div>
  );
}

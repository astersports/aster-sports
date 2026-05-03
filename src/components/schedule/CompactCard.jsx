import { useNavigate } from 'react-router-dom';
import { formatTime } from '../../lib/formatters';
import { TYPE_LABELS } from '../../lib/constants';
import { useNow } from '../../hooks/useNow';

export default function CompactCard({ event, stagger }) {
  const navigate = useNavigate();
  const now = useNow();
  const team = event.teams;
  const teamColor = team?.team_color || 'var(--em-neutral)';
  const teamName = team?.name || '';
  const endTime = event.end_at ? new Date(event.end_at).getTime() : null;
  const startTime = event.start_at ? new Date(event.start_at).getTime() : null;
  const isPast = endTime ? endTime < now : (startTime ? startTime < now : false);

  return (
    <div
      role="link"
      tabIndex={0}
      aria-label={`${event.teams?.name || ''} ${TYPE_LABELS[event.event_type] || ''}, ${formatTime(event.start_at)}`}
      className={`sf-press ${isPast ? '' : (stagger || '')}`}
      onClick={() => { navigator.vibrate?.(10); navigate(`/events/${event.id}`, { state: { event } }); }}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`/events/${event.id}`, { state: { event } }); } }}
      style={{
        display: 'flex',
        alignItems: 'center',
        minHeight: 48,
        backgroundColor: 'var(--em-bg-card)',
        borderRadius: 8,
        border: '1px solid var(--em-border-default)',
        overflow: 'hidden',
        opacity: isPast ? 0.5 : 1,
        cursor: 'pointer',
        transition: 'box-shadow 150ms ease-out, opacity 150ms ease-out',
      }}
    >
      <div style={{ width: 3, alignSelf: 'stretch', flexShrink: 0, backgroundColor: teamColor }} />
      <div className="flex items-center flex-1 gap-3" style={{ padding: '6px 12px' }}>
        <span className="font-bold" style={{ fontSize: 15, color: 'var(--em-text-primary)', minWidth: 56 }}>
          {formatTime(event.start_at)}
        </span>
        <span style={{
          fontSize: 11, fontWeight: 600, padding: '1px 5px', borderRadius: 4,
          backgroundColor: teamColor, color: 'var(--em-text-inverse)',
        }}>{teamName}</span>
        <span className="truncate" style={{ flex: 1, fontSize: 13, color: 'var(--em-text-secondary)' }}>
          {event.title || TYPE_LABELS[event.event_type] || event.event_type || 'Event'}
        </span>
      </div>
    </div>
  );
}

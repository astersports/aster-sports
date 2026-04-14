import { useNavigate } from 'react-router-dom';
import { formatTime } from '../../lib/formatters';

const TYPE_LABELS = { practice: 'Practice', game: 'Game', skills_lab: 'Skills Lab', tryout: 'Tryout', tournament: 'Tournament', other: 'Event' };

export default function CompactCard({ event, stagger }) {
  const navigate = useNavigate();
  const team = event.teams;
  const teamColor = team?.team_color || 'var(--sf-neutral)';
  const teamName = team?.name || '';
  const isPast = event.start_at && new Date(event.start_at) < new Date();

  return (
    <div
      className={`sf-press ${stagger || ''}`}
      onClick={() => { navigator.vibrate?.(10); navigate(`/events/${event.id}`); }}
      style={{
        display: 'flex',
        alignItems: 'center',
        minHeight: 48,
        backgroundColor: 'var(--sf-bg-card)',
        borderRadius: 8,
        border: '1px solid var(--sf-border-default)',
        overflow: 'hidden',
        opacity: isPast ? 0.5 : 1,
        cursor: 'pointer',
        transition: 'box-shadow 150ms ease-out, opacity 150ms ease-out',
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
          {event.title || TYPE_LABELS[event.event_type] || event.event_type || 'Event'}
        </span>
      </div>
    </div>
  );
}

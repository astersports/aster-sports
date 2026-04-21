import { useNavigate } from 'react-router-dom';
import { MapPin, Calendar } from 'lucide-react';
import StatusBadge from './StatusBadge';

// Single row in the tournaments list. Shows name, date range, attending teams
// as colored pills, status badge, venue. Tap navigates to detail (built in 2B).

function formatRange(start, end) {
  if (!start || !end) return '';
  const s = new Date(start + 'T12:00:00');
  const e = new Date(end + 'T12:00:00');
  const opts = { month: 'short', day: 'numeric' };
  if (start === end) return s.toLocaleDateString('en-US', opts);
  const sameMonth = s.getMonth() === e.getMonth();
  if (sameMonth) return `${s.toLocaleDateString('en-US', opts)}–${e.getDate()}`;
  return `${s.toLocaleDateString('en-US', opts)} – ${e.toLocaleDateString('en-US', opts)}`;
}

export default function TournamentListItem({ tournament, rightSlot }) {
  const navigate = useNavigate();
  const dateRange = formatRange(tournament.start_date, tournament.end_date);
  const open = () => navigate(`/tournaments/${tournament.id}`);
  const onKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={open}
      onKeyDown={onKeyDown}
      className="sf-press"
      aria-label={`Open tournament ${tournament.name}`}
      style={{
        width: '100%', textAlign: 'left',
        backgroundColor: 'var(--sf-bg-card)',
        border: '1px solid var(--sf-border-default)',
        borderRadius: 10, padding: 14, marginBottom: 10,
        boxShadow: 'var(--sf-shadow-sm)',
        display: 'flex', flexDirection: 'column', gap: 8,
        cursor: 'pointer', minHeight: 44,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--sf-text-primary)', lineHeight: 1.3 }}>
          {tournament.name}
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
          <StatusBadge status={tournament.status} />
          {rightSlot}
        </div>
      </div>

      <div style={{ fontSize: 12, color: 'var(--sf-text-secondary)', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Calendar size={12} strokeWidth={1.75} />
          {dateRange}
        </span>
        {tournament.primary_venue && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <MapPin size={12} strokeWidth={1.75} />
            {tournament.primary_venue}
          </span>
        )}
      </div>

      {tournament.teams?.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {tournament.teams.map((t) => (
            <span key={t.id} style={{
              fontSize: 11, fontWeight: 500,
              padding: '2px 8px', borderRadius: 999,
              backgroundColor: 'var(--sf-bg-tertiary)',
              color: 'var(--sf-text-primary)',
              borderLeft: `3px solid ${t.team_color || 'var(--sf-text-tertiary)'}`,
            }}>
              {t.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

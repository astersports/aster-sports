import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { formatTournamentRange } from '../../lib/formatters';

// Single row in the tournaments list. Shows name, date range, attending teams
// as colored pills, status badge, venue. Tap navigates to detail (built in 2B).

export default function TournamentListItem({ tournament, rightSlot }) {
  const navigate = useNavigate();
  const dateRange = formatTournamentRange(tournament.start_date, tournament.end_date);
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
      className="as-press"
      aria-label={`Open tournament ${tournament.name}`}
      style={{
        width: '100%', textAlign: 'left',
        backgroundColor: 'var(--as-bg-card)',
        border: '1px solid var(--as-border-default)',
        borderRadius: 10, padding: 14, marginBottom: 10,
        boxShadow: 'var(--as-shadow-sm)',
        display: 'flex', flexDirection: 'column', gap: 8,
        cursor: 'pointer', minHeight: 44,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--as-text-primary)', lineHeight: 1.3 }}>
          {tournament.name}
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
          <StatusBadge status={tournament.status} />
          {rightSlot}
        </div>
      </div>

      <div style={{ fontSize: 13, color: 'var(--as-text-secondary)', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
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
              backgroundColor: 'var(--as-bg-tertiary)',
              color: 'var(--as-text-primary)',
              borderLeft: `3px solid ${t.team_color || 'var(--as-text-tertiary)'}`,
            }}>
              {t.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';
import { useAttendanceData } from '../../hooks/useAttendanceData';
import FilterSelect from '../shared/FilterSelect';
import LoadingSkeleton from '../shared/LoadingSkeleton';

const CELL_COLORS = {
  attended: { bg: 'var(--em-success)', border: 'none' },
  no_show: { bg: 'transparent', border: '2px solid var(--em-danger)', icon: '✕' },
  declined: { bg: 'var(--em-bg-tertiary)', border: 'none' },
  rsvp_yes: { bg: 'transparent', border: '2px solid var(--em-success)' },
  rsvp_maybe: { bg: 'transparent', border: '2px solid var(--em-warning)' },
  rsvp_no: { bg: 'var(--em-bg-tertiary)', border: 'none' },
  no_response: { bg: 'transparent', border: '1px solid var(--em-border-default)' },
  no_response_past: { bg: 'transparent', border: '1px dashed var(--em-border-default)' },
};

export default function TeamHeatmap({ teamId, teamColor }) {
  const [filter, setFilter] = useState('all');
  const { grid, events, loading } = useAttendanceData(teamId, filter);

  if (loading) return <div style={{ padding: 16 }}><LoadingSkeleton variant="card" count={1} /></div>;

  const totalAttended = grid.reduce((s, r) => s + r.attended, 0);
  const totalExpected = grid.reduce((s, r) => s + r.expected, 0);
  const teamPct = totalExpected > 0 ? Math.round((totalAttended / totalExpected) * 100) : 0;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px 8px' }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--em-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Team Pulse</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: teamColor || 'var(--em-accent)' }}>{teamPct}%</div>
          <div style={{ fontSize: 12, color: 'var(--em-text-tertiary)' }}>attendance · last 4 weeks</div>
        </div>
        <FilterSelect
          value={filter}
          onChange={(v) => setFilter(v || 'all')}
          options={[{ value: 'all', label: 'All' }, { value: 'practices', label: 'Practice' }, { value: 'games', label: 'Games' }]}
          ariaLabel="Filter event type"
        />
      </div>

      <div style={{ overflowX: 'auto', padding: '0 16px 16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: `140px repeat(${events.length}, 32px) 80px`, gap: 3, alignItems: 'center' }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--em-text-tertiary)' }}>Player</div>
          {events.map((e) => (
            <div key={e.id} style={{ fontSize: 9, color: 'var(--em-text-tertiary)', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden' }}>
              {new Date(e.start_at).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })}
            </div>
          ))}
          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--em-text-tertiary)', textAlign: 'right' }}>ATT%</div>

          {grid.map((row) => (
            <div key={row.player.id} style={{ display: 'contents' }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--em-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                <span style={{ fontSize: 11, color: 'var(--em-text-tertiary)', marginRight: 4 }}>#{row.player.jersey_number || '—'}</span>
                {row.player.first_name}
              </div>
              {row.cells.map((c, i) => {
                const s = CELL_COLORS[c.state] || CELL_COLORS.no_response;
                return (
                  <div key={events[i]?.id || i} style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: s.bg, border: s.border, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'var(--em-danger)' }}>
                    {s.icon || ''}
                  </div>
                );
              })}
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: 17, fontWeight: 800, color: row.pct !== null && row.pct < 60 ? 'var(--em-danger)' : row.pct !== null && row.pct >= 80 ? 'var(--em-success)' : 'var(--em-text-primary)' }}>{row.pct ?? '—'}%</span>
                {row.streak >= 3 && <div style={{ fontSize: 11, color: 'var(--em-warning)' }}>🔥 {row.streak}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

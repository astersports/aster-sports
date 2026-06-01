import { memo } from 'react';
const LABELS = {
  fg2_made: '+2', fg2_miss: '2PT Miss', fg3_made: '+3', fg3_miss: '3PT Miss',
  ft_made: 'FT', ft_miss: 'FT Miss', rebound: 'REB', assist: 'AST',
  steal: 'STL', block: 'BLK', turnover: 'TO', foul: 'Foul',
  sub_in: 'In', sub_out: 'Out', timeout: 'Timeout',
};
const COLORS = {
  fg2_made: 'var(--as-success)', fg3_made: 'var(--as-success)', ft_made: 'var(--as-warning)',
  fg2_miss: 'var(--as-danger)', fg3_miss: 'var(--as-danger)', ft_miss: 'var(--as-danger)',
  foul: 'var(--as-danger)', turnover: 'var(--as-danger)',
};
const periodLabel = (p) => p <= 2 ? `H${p}` : 'OT';

export default memo(function PlayByPlayFeed({ plays, players }) {
  const nameMap = {};
  (players || []).forEach((p) => { nameMap[p.id] = p.first_name; });
  const recent = [...plays].reverse();

  return (
    <div style={{ padding: '12px 16px' }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--as-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Play by Play</div>
      {recent.length === 0 && <div style={{ fontSize: 13, color: 'var(--as-text-tertiary)', padding: 12 }}>No plays yet.</div>}
      {recent.map((p) => (
        <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--as-border-subtle)', fontSize: 13 }}>
          <span style={{ width: 52, fontWeight: 700, color: COLORS[p.play_type] || 'var(--as-text-primary)', flexShrink: 0 }}>{LABELS[p.play_type] || p.play_type}</span>
          <span style={{ flex: 1, color: 'var(--as-text-secondary)' }}>
            {p.is_opponent ? 'Opponent' : (nameMap[p.player_id] || (p.player_id ? 'Unknown' : 'Unassigned'))}
          </span>
          <span style={{ fontSize: 11, color: 'var(--as-text-tertiary)' }}>{periodLabel(p.period)}</span>
        </div>
      ))}
    </div>
  );
});

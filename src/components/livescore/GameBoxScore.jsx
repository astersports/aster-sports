export default function GameBoxScore({ stats }) {
  const isDnp = (s) => !s.pts && !s.fg_att && !s.ft_att;
  const active = stats.filter((s) => !isDnp(s));
  const dnps = stats.filter((s) => isDnp(s));

  if (stats.length === 0) return null;

  const th = { fontSize: 11, fontWeight: 600, color: 'var(--as-text-tertiary)', padding: '6px 4px', textAlign: 'right', position: 'sticky', top: 0, backgroundColor: 'var(--as-bg-card)' };
  const td = { fontSize: 13, fontWeight: 500, color: 'var(--as-text-primary)', padding: '8px 4px', textAlign: 'right', borderTop: '1px solid var(--as-border-subtle)' };
  const nameStyle = { ...td, textAlign: 'left', fontWeight: 600 };

  return (
    <div style={{ backgroundColor: 'var(--as-bg-card)', borderRadius: 10, border: '1px solid var(--as-border-default)', overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 400 }}>
          <thead>
            <tr>
              <th style={{ ...th, textAlign: 'left', width: 28 }}>#</th>
              <th style={{ ...th, textAlign: 'left' }}>Player</th>
              <th style={th}>PTS</th>
              <th style={th}>REB</th>
              <th style={th}>AST</th>
              <th style={th}>STL</th>
              <th style={th}>FG</th>
              <th style={th}>3PT</th>
              <th style={th}>FT</th>
            </tr>
          </thead>
          <tbody>
            {active.map((s) => {
              const name = s.players ? `${s.players.first_name} ${(s.players.last_name || '')[0]}.` : '—';
              return (
                <tr key={s.player_id}>
                  <td style={{ ...nameStyle, color: 'var(--as-text-tertiary)', fontWeight: 700, width: 28 }}>{s.jersey_at_time || '—'}</td>
                  <td style={nameStyle}>{name}</td>
                  <td style={{ ...td, fontWeight: 700 }}>{s.pts}</td>
                  <td style={td}>{s.reb || '—'}</td>
                  <td style={td}>{s.ast || '—'}</td>
                  <td style={td}>{s.stl || '—'}</td>
                  <td style={td}>{s.fg_made}/{s.fg_att}</td>
                  <td style={td}>{s.three_made}/{s.three_att}</td>
                  <td style={td}>{s.ft_made}/{s.ft_att}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {dnps.length > 0 && (
        <div style={{ padding: '8px 12px', fontSize: 12, color: 'var(--as-text-tertiary)', borderTop: '1px solid var(--as-border-subtle)' }}>
          DNP: {dnps.map((s) => s.players?.first_name || '—').join(', ')}
        </div>
      )}
    </div>
  );
}

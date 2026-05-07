export default function GameBoxScore({ playerStats, players }) {
  const rows = players
    .filter((p) => playerStats[p.id])
    .map((p) => ({ ...p, s: playerStats[p.id] }))
    .sort((a, b) => (b.s.pts || 0) - (a.s.pts || 0));

  const dnps = players.filter((p) => !playerStats[p.id]);

  if (rows.length === 0) return null;

  const th = { fontSize: 11, fontWeight: 600, color: 'var(--em-text-tertiary)', padding: '6px 4px', textAlign: 'right', position: 'sticky', top: 0, backgroundColor: 'var(--em-bg-card)' };
  const td = { fontSize: 13, fontWeight: 500, color: 'var(--em-text-primary)', padding: '8px 4px', textAlign: 'right', borderTop: '1px solid var(--em-border-subtle)' };
  const nameStyle = { ...td, textAlign: 'left', fontWeight: 600 };

  return (
    <div style={{ backgroundColor: 'var(--em-bg-card)', borderRadius: 10, border: '1px solid var(--em-border-default)', overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 420 }}>
          <thead>
            <tr>
              <th style={{ ...th, textAlign: 'left', width: 28 }}>#</th>
              <th style={{ ...th, textAlign: 'left' }}>Player</th>
              <th style={th}>PTS</th>
              <th style={th}>REB</th>
              <th style={th}>AST</th>
              <th style={th}>FG</th>
              <th style={th}>3PT</th>
              <th style={th}>FT</th>
              <th style={th}>STL</th>
              <th style={th}>BLK</th>
              <th style={th}>TO</th>
              <th style={th}>PF</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td style={{ ...nameStyle, color: 'var(--em-text-tertiary)', fontWeight: 700, width: 28 }}>{r.jersey_number || '—'}</td>
                <td style={nameStyle}>{r.first_name}</td>
                <td style={{ ...td, fontWeight: 700 }}>{r.s.pts}</td>
                <td style={td}>{r.s.reb || '—'}</td>
                <td style={td}>{r.s.ast || '—'}</td>
                <td style={td}>{r.s.fgm}/{r.s.fga}</td>
                <td style={td}>{r.s.fg3m}/{r.s.fg3a}</td>
                <td style={td}>{r.s.ftm}/{r.s.fta}</td>
                <td style={td}>{r.s.stl || '—'}</td>
                <td style={td}>{r.s.blk || '—'}</td>
                <td style={td}>{r.s.to || '—'}</td>
                <td style={td}>{r.s.foul || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {dnps.length > 0 && (
        <div style={{ padding: '8px 12px', fontSize: 12, color: 'var(--em-text-tertiary)', borderTop: '1px solid var(--em-border-subtle)' }}>
          DNP: {dnps.map((p) => p.first_name).join(', ')}
        </div>
      )}
    </div>
  );
}

export default function BoxScore({ playerStats, players }) {
  const nameMap = {};
  (players || []).forEach((p) => { nameMap[p.id] = { name: p.first_name, jersey: p.jersey_number }; });

  const rows = Object.entries(playerStats)
    .map(([id, s]) => ({ id, ...s, ...(nameMap[id] || { name: '?', jersey: '' }) }))
    .sort((a, b) => b.pts - a.pts);

  if (rows.length === 0) return <div style={{ padding: 24, textAlign: 'center', color: 'var(--as-text-tertiary)', fontSize: 13 }}>No player stats yet.</div>;

  const cols = ['PTS', 'REB', 'AST', 'STL', 'BLK', 'TO', 'PF'];
  const keys = ['pts', 'reb', 'ast', 'stl', 'blk', 'to', 'foul'];
  const hdr = { fontSize: 10, fontWeight: 700, color: 'var(--as-text-tertiary)', textAlign: 'center', padding: '8px 2px', textTransform: 'uppercase' };
  const cell = { fontSize: 13, fontWeight: 500, color: 'var(--as-text-primary)', textAlign: 'center', padding: '8px 2px' };

  return (
    <div style={{ padding: '12px 16px', overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--as-border-default)' }}>
            <th style={{ ...hdr, textAlign: 'left', minWidth: 80 }}>Player</th>
            {cols.map((c) => <th key={c} style={hdr}>{c}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} style={{ borderBottom: '1px solid var(--as-border-subtle)' }}>
              <td style={{ fontSize: 13, fontWeight: 500, color: 'var(--as-text-primary)', padding: '8px 4px 8px 0', whiteSpace: 'nowrap' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--as-text-tertiary)', marginRight: 4 }}>#{r.jersey || '—'}</span>
                {r.name}
              </td>
              {keys.map((k) => (
                <td key={k} style={{ ...cell, color: k === 'foul' && r[k] >= 4 ? 'var(--as-danger)' : cell.color, fontWeight: k === 'foul' && r[k] >= 4 ? 700 : 500 }}>{r[k] || 0}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

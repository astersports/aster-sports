const display = "var(--sf-bc-display, 'Barlow Condensed', sans-serif)";

export default function StandingsTable({ teams, recordsByTeam }) {
  const rows = teams.map((t) => {
    const s = recordsByTeam[t.id] || { record: '0-0', winPct: 0, ppg: 0, allowed: 0, diff: 0, gamesPlayed: 0 };
    return { ...t, ...s };
  }).sort((a, b) => b.winPct - a.winPct || b.diff - a.diff);

  if (rows.length === 0) return null;

  const hdr = { fontSize: 10, fontWeight: 700, color: 'var(--sf-bc-text-mute)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '8px 4px', textAlign: 'center' };
  const cell = { fontSize: 14, fontWeight: 600, color: 'var(--sf-bc-text)', padding: '10px 4px', textAlign: 'center', borderBottom: '1px solid var(--sf-bc-border)' };

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--sf-bc-border)' }}>
            <th style={{ ...hdr, textAlign: 'left', paddingLeft: 0, minWidth: 100 }}>Team</th>
            <th style={hdr}>W-L</th>
            <th style={hdr}>PCT</th>
            <th style={hdr}>PPG</th>
            <th style={hdr}>OPP</th>
            <th style={hdr}>DIFF</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td style={{ ...cell, textAlign: 'left', paddingLeft: 0 }}>
                <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 9999, backgroundColor: r.team_color, marginRight: 8, verticalAlign: 'middle' }} />
                <span style={{ fontFamily: display, fontWeight: 700, textTransform: 'uppercase' }}>{r.name}</span>
              </td>
              <td style={{ ...cell, fontFamily: display, fontWeight: 800, color: r.team_color }}>{r.record}</td>
              <td style={cell}>{r.winPct}%</td>
              <td style={cell}>{r.ppg}</td>
              <td style={cell}>{r.allowed}</td>
              <td style={{ ...cell, color: r.diff >= 0 ? 'var(--sf-bc-green)' : 'var(--sf-bc-red)' }}>{r.diff > 0 ? `+${r.diff}` : r.diff}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

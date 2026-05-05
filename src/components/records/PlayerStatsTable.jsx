import Label from '../shared/Label';

const COLS = [
  { key: 'jersey', label: '#', w: 28 },
  { key: 'name', label: 'Player', w: null },
  { key: 'gp', label: 'GP', w: 30 },
  { key: 'pts', label: 'PTS', w: 34 },
  { key: 'reb', label: 'REB', w: 34 },
  { key: 'ast', label: 'AST', w: 34 },
  { key: 'stl', label: 'STL', w: 34 },
  { key: 'blk', label: 'BLK', w: 34 },
  { key: 'to', label: 'TO', w: 28 },
  { key: 'pf', label: 'PF', w: 28 },
];

export default function PlayerStatsTable({ players, stats, showAvg }) {
  if (!players?.length) return null;
  const hasStats = Object.keys(stats).length > 0;

  const rows = players
    .map((p) => {
      const s = stats[p.id] || { pts: 0, reb: 0, ast: 0, stl: 0, blk: 0, to: 0, foul: 0, gp: 0 };
      const gp = s.gp || 1;
      return {
        id: p.id,
        jersey: p.jersey_number ?? '—',
        name: `${p.first_name} ${(p.last_name || '').charAt(0)}.`,
        gp: s.gp,
        pts: showAvg ? (s.pts / gp).toFixed(1) : s.pts,
        reb: showAvg ? (s.reb / gp).toFixed(1) : s.reb,
        ast: showAvg ? (s.ast / gp).toFixed(1) : s.ast,
        stl: showAvg ? (s.stl / gp).toFixed(1) : s.stl,
        blk: showAvg ? (s.blk / gp).toFixed(1) : s.blk,
        to: showAvg ? (s.to / gp).toFixed(1) : s.to,
        pf: showAvg ? (s.foul / gp).toFixed(1) : s.foul,
        sortPts: s.pts,
      };
    })
    .sort((a, b) => b.sortPts - a.sortPts);

  if (!hasStats) {
    return (
      <div style={{ padding: 16, textAlign: 'center', color: 'var(--em-text-tertiary)', fontSize: 13 }}>
        No game stats recorded yet. Stats appear after live scoring a game.
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 420 }}>
        <thead>
          <tr>
            {COLS.map((c) => (
              <th key={c.key} style={{ padding: '8px 4px', textAlign: c.key === 'name' ? 'left' : 'center', fontWeight: 500, fontSize: 11, color: 'var(--em-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--em-border-default)', width: c.w || undefined, whiteSpace: 'nowrap' }}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td style={cell('center', true)}>{r.jersey}</td>
              <td style={{ ...cell('left', false), fontWeight: 500, whiteSpace: 'nowrap' }}>{r.name}</td>
              <td style={cell('center', false)}>{r.gp}</td>
              <td style={{ ...cell('center', false), fontWeight: 600 }}>{r.pts}</td>
              <td style={cell('center', false)}>{r.reb}</td>
              <td style={cell('center', false)}>{r.ast}</td>
              <td style={cell('center', false)}>{r.stl}</td>
              <td style={cell('center', false)}>{r.blk}</td>
              <td style={cell('center', false)}>{r.to}</td>
              <td style={cell('center', false)}>{r.pf}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function cell(align, dim) {
  return { padding: '10px 4px', textAlign: align, color: dim ? 'var(--em-text-tertiary)' : 'var(--em-text-primary)', borderBottom: '1px solid var(--em-border-subtle)' };
}

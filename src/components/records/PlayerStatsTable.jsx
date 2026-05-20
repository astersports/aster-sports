import { useState } from 'react';

const BASE_COLS = [
  { key: 'jersey', label: '#', w: 28 },
  { key: 'name', label: 'Player', w: null },
  { key: 'gp', label: 'GP', w: 28 },
  { key: 'pts', label: 'PTS', w: 34, bold: true },
  { key: 'reb', label: 'REB', w: 34 },
  { key: 'ast', label: 'AST', w: 34 },
  { key: 'stl', label: 'STL', w: 34 },
  { key: 'fg', label: 'FG%', w: 38 },
  { key: 'tp', label: '3P%', w: 38 },
  { key: 'ftp', label: 'FT%', w: 38 },
];

const MORE_COLS = [
  { key: 'blk', label: 'BLK', w: 34 },
  { key: 'to', label: 'TO', w: 28 },
  { key: 'pf', label: 'PF', w: 28 },
  { key: 'pm', label: '+/-', w: 34 },
];

export default function PlayerStatsTable({ players, stats, showAvg }) {
  const [showMore, setShowMore] = useState(false);
  if (!players?.length) return null;
  const hasStats = Object.keys(stats).length > 0;
  const cols = showMore ? [...BASE_COLS, ...MORE_COLS] : BASE_COLS;

  const pct = (made, att) => att > 0 ? `${Math.round((made / att) * 100)}` : '—';
  const avg = (val, gp) => showAvg && gp > 0 ? (val / gp).toFixed(1) : val;

  const rows = players
    .map((p) => {
      const s = stats[p.id] || {};
      const gp = s.gp || 0;
      return {
        id: p.id, jersey: p.jersey_number ?? '—',
        name: `${p.first_name} ${(p.last_name || '').charAt(0)}.`,
        gp, pts: avg(s.pts || 0, gp), reb: avg(s.reb || 0, gp),
        ast: avg(s.ast || 0, gp), stl: avg(s.stl || 0, gp),
        fg: pct(s.fg_made, s.fg_att), tp: pct(s.three_made, s.three_att), ftp: pct(s.ft_made, s.ft_att),
        blk: avg(s.blk || 0, gp), to: avg(s.to || 0, gp), pf: avg(s.foul || 0, gp),
        pm: s.plus_minus > 0 ? `+${s.plus_minus}` : `${s.plus_minus || 0}`,
        sortPts: s.pts || 0,
      };
    })
    .sort((a, b) => b.sortPts - a.sortPts);

  if (!hasStats) {
    // 2026-05-20 — per CLAUDE.md §16.12, per-player game stats are NOT
    // tracked at the league-management layer; team-level totals only.
    // Per-player rows here come from the optional live-scoring mode,
    // which captures play-by-play. Frank flagged the previous copy
    // ("No game stats recorded yet") reading like a bug on a team with
    // 12 played games — clarifying scope so admins know team totals
    // (above) are the canonical record.
    return (
      <div style={{ padding: 16, textAlign: 'center', color: 'var(--em-text-tertiary)', fontSize: 13 }}>
        Per-player stats appear only when a game is scored in live-scoring mode. Team totals are tracked above.
      </div>
    );
  }

  return (
    <>
      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: showMore ? 560 : 420 }}>
          <thead>
            <tr>
              {cols.map((c) => (
                <th key={c.key} style={{ padding: '8px 4px', textAlign: c.key === 'name' ? 'left' : 'center', fontWeight: 500, fontSize: 11, color: 'var(--em-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--em-border-default)', width: c.w || undefined, whiteSpace: 'nowrap' }}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                {cols.map((c) => (
                  <td key={c.key} style={{ padding: '8px 4px', textAlign: c.key === 'name' ? 'left' : 'center', fontWeight: c.bold ? 600 : 400, color: c.key === 'jersey' ? 'var(--em-text-tertiary)' : 'var(--em-text-primary)', borderBottom: '1px solid var(--em-border-subtle)', whiteSpace: 'nowrap' }}>
                    {r[c.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button type="button" onClick={() => setShowMore((v) => !v)} className="sf-press" style={{ width: '100%', minHeight: 36, background: 'none', border: 'none', fontSize: 13, fontWeight: 500, color: 'var(--em-accent)', padding: '8px 0' }}>
        {showMore ? 'Hide details' : 'More stats (BLK, TO, PF, +/-)'}
      </button>
    </>
  );
}

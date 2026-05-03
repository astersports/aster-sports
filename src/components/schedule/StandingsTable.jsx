import { EMPTY_SUMMARY } from '../../lib/teamRecords';
import Label from '../shared/Label';

const thStyle = { padding: '6px 4px', fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', color: 'var(--em-text-tertiary)' };
const tdStyle = { padding: '10px 4px', fontSize: 13, color: 'var(--em-text-secondary)' };

export default function StandingsTable({ teams, recordsByTeamId, totalGames }) {
  const rows = teams
    .map((t) => ({ ...t, summary: recordsByTeamId[t.id] || EMPTY_SUMMARY }))
    .sort((a, b) => {
      const pctDiff = b.summary.winPct - a.summary.winPct;
      if (pctDiff !== 0) return pctDiff;
      return parseInt(b.summary.record) - parseInt(a.summary.record);
    });

  if (rows.length === 0) return null;

  return (
    <div style={{
      backgroundColor: 'var(--em-bg-card)',
      borderRadius: 10,
      border: '1px solid var(--em-border-default)',
      boxShadow: 'var(--em-shadow-sm)',
      overflow: 'hidden',
      marginBottom: 16,
    }}>
      <div style={{ padding: '12px 16px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <Label style={{ marginBottom: 0 }}>STANDINGS</Label>
        {totalGames > 0 && (
          <div style={{ fontSize: 11, color: 'var(--em-text-tertiary)' }}>
            Through {totalGames} game{totalGames !== 1 ? 's' : ''}
          </div>
        )}
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--em-border-default)' }}>
            <th style={{ ...thStyle, width: 28, textAlign: 'center' }}>#</th>
            <th style={{ ...thStyle, textAlign: 'left' }}>TEAM</th>
            <th style={{ ...thStyle, width: 32, textAlign: 'center' }}>W</th>
            <th style={{ ...thStyle, width: 32, textAlign: 'center' }}>L</th>
            <th style={{ ...thStyle, width: 32, textAlign: 'center' }}>T</th>
            <th style={{ ...thStyle, width: 36, textAlign: 'center' }}>PF</th>
            <th style={{ ...thStyle, width: 36, textAlign: 'center' }}>PA</th>
            <th style={{ ...thStyle, width: 44, textAlign: 'right', paddingRight: 16 }}>PCT</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((t, i) => {
            const s = t.summary;
            const parts = s.record.split('-');
            const w = parseInt(parts[0]) || 0;
            const l = parseInt(parts[1]) || 0;
            const ties = s.ties || 0;
            const pct = s.gamesPlayed > 0 ? Math.round((w / s.gamesPlayed) * 100) + '%' : '0%';
            return (
              <tr key={t.id} style={{ borderBottom: i < rows.length - 1 ? '1px solid var(--em-border-subtle)' : 'none' }}>
                <td style={{ ...tdStyle, textAlign: 'center', color: 'var(--em-text-tertiary)', fontWeight: 600 }}>{i + 1}</td>
                <td style={{ ...tdStyle, textAlign: 'left' }}>
                  <div className="flex items-center gap-2">
                    <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: t.team_color, flexShrink: 0 }} />
                    <span style={{ fontWeight: 500, color: 'var(--em-text-primary)' }}>{t.name}</span>
                  </div>
                </td>
                <td style={{ ...tdStyle, textAlign: 'center' }}>{w}</td>
                <td style={{ ...tdStyle, textAlign: 'center' }}>{l}</td>
                <td style={{ ...tdStyle, textAlign: 'center' }}>{ties}</td>
                <td style={{ ...tdStyle, textAlign: 'center' }}>{s.pointsFor || 0}</td>
                <td style={{ ...tdStyle, textAlign: 'center' }}>{s.pointsAgainst || 0}</td>
                <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600, paddingRight: 16 }}>{pct}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div style={{ padding: '6px 16px 10px', fontSize: 11, color: 'var(--em-text-tertiary)' }}>
        W = Wins · L = Losses · T = Ties · PF = Points For · PA = Points Against · PCT = Win %
      </div>
    </div>
  );
}

import { Link } from 'react-router-dom';

// One pool's standings on the Hub division page (R1·PR-A): Team | W | L | PD | PA
// | PS. Teams arrive pre-sorted from the RPC (wins desc, then point diff). The
// team name links to that team's public schedule; the org's own team is starred.
// PD = point differential, PA = points against, PS = points scored. --as-* tokens.

const poolLabel = { margin: '0 0 8px', fontSize: 11, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--as-text-meta)' };
const th = { padding: '8px 6px', fontSize: 11, fontWeight: 600, color: 'var(--as-text-meta)', textAlign: 'right' };
const td = { padding: '10px 6px', fontSize: 13, color: 'var(--as-text-secondary)', textAlign: 'right', borderTop: '1px solid var(--as-border-subtle)' };
const fmtDiff = (n) => (n > 0 ? `+${n}` : `${n ?? 0}`);

export default function AauStandingsTable({ pool, teams }) {
  const rows = Array.isArray(teams) ? teams : [];
  return (
    <section style={{ marginBottom: 16 }}>
      {pool && <h3 style={poolLabel}>{pool}</h3>}
      <div style={{ overflowX: 'auto', backgroundColor: 'var(--as-bg-card)', border: '1px solid var(--as-border-default)', borderRadius: 10, boxShadow: 'var(--as-shadow-sm)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ ...th, textAlign: 'left', paddingLeft: 12 }}>Team</th>
              <th style={th}>W</th><th style={th}>L</th><th style={th}>PD</th><th style={th}>PA</th><th style={th}>PS</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((t, i) => (
              <tr key={t.team_key || t.id || i}>
                <td style={{ ...td, textAlign: 'left', paddingLeft: 12, color: 'var(--as-text-primary)', fontWeight: 600 }}>
                  {t.team_key
                    ? <Link to={`/hub/team/${encodeURIComponent(t.team_key)}`} style={{ color: 'inherit', textDecoration: 'none' }}>{t.name || 'Team'}{t.isOurs ? ' ★' : ''}</Link>
                    : <>{t.name || 'Team'}{t.isOurs ? ' ★' : ''}</>}
                </td>
                <td style={td}>{t.wins ?? 0}</td>
                <td style={td}>{t.losses ?? 0}</td>
                <td style={td}>{fmtDiff(t.diff)}</td>
                <td style={td}>{t.pointsAgainst ?? 0}</td>
                <td style={td}>{t.pointsFor ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

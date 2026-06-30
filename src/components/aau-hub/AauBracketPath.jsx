import { formatTime } from '../../lib/formatters';
import { groupBracketByDay } from '../../lib/aau/bracketPath';

// "Playoff path" for a tracked team's live tournament (R1·PR-A). Renders the
// whole division bracket — entry games, then "Winner B1 vs Winner B2"
// advancement games up to the final — grouped by day, so a parent sees the full
// weekend path before it's played. The team's own slots highlight in gold once
// it's seeded. Pure presentational; --as-* tokens only. Hidden when no live
// bracket (paths empty).

const sectionLabel = { margin: '24px 0 4px', fontSize: 11, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--as-text-tertiary)' };
const dayLabelStyle = { margin: '14px 0 8px', fontSize: 13, fontWeight: 600, color: 'var(--as-text-primary)' };
const cardStyle = { backgroundColor: 'var(--as-bg-card)', border: '1px solid var(--as-border-default)', borderRadius: 10, boxShadow: 'var(--as-shadow-sm)', padding: 12 };
const codeChip = { fontSize: 11, fontWeight: 600, padding: '2px 6px', borderRadius: 6, backgroundColor: 'var(--as-bg-secondary)', color: 'var(--as-text-secondary)' };
const metaStyle = { fontSize: 12, fontWeight: 500, color: 'var(--as-text-secondary)' };

function Side({ name, isMine, score, played }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
      <span style={{ minWidth: 0, fontSize: 14, fontWeight: isMine ? 700 : 500, color: isMine ? 'var(--as-accent)' : 'var(--as-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {name || 'TBD'}
      </span>
      {played && <span style={{ flexShrink: 0, fontSize: 14, fontWeight: 700, color: 'var(--as-text-primary)' }}>{score}</span>}
    </div>
  );
}

function BracketGame({ g }) {
  const played = g.homeScore != null && g.awayScore != null;
  return (
    <article style={cardStyle}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
        <span style={codeChip}>{g.gameCode || 'Bracket'}</span>
        <span style={metaStyle}>
          {g.startAt ? formatTime(g.startAt) : 'Time TBD'}{g.court ? ` · ${g.court}` : ''}
        </span>
      </div>
      <Side name={g.home} isMine={g.homeIsMine} score={g.homeScore} played={played} />
      <div style={{ height: 1, backgroundColor: 'var(--as-border-subtle)', margin: '6px 0' }} />
      <Side name={g.away} isMine={g.awayIsMine} score={g.awayScore} played={played} />
    </article>
  );
}

export default function AauBracketPath({ paths }) {
  if (!Array.isArray(paths) || paths.length === 0) return null;

  return (
    <section aria-label="Playoff path">
      <h2 style={sectionLabel}>Playoff path</h2>
      <p style={{ margin: '0 0 4px', fontSize: 13, color: 'var(--as-text-secondary)' }}>
        The full bracket for this weekend — your games light up once seeds are set.
      </p>
      {paths.map((p) => (
        <div key={`${p.tournamentId}-${p.division}`} style={{ marginTop: 8 }}>
          {paths.length > 1 && (
            <p style={{ margin: '8px 0 0', fontSize: 13, fontWeight: 600, color: 'var(--as-text-primary)' }}>{p.division}</p>
          )}
          {groupBracketByDay(p.games).map((grp) => (
            <div key={grp.key}>
              <p style={dayLabelStyle}>{grp.label}</p>
              <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'minmax(0, 1fr)' }}>
                {grp.games.map((g, i) => <BracketGame key={g.gameCode || i} g={g} />)}
              </div>
            </div>
          ))}
        </div>
      ))}
    </section>
  );
}

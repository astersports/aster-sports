import { Link } from 'react-router-dom';

// Grouped results for the no-login Hub search (R1·PR-A). Presentational —
// receives the { teams, divisions, tournaments } object from search_public_aau.
// Team cards link to that team's public schedule (the teamKey is the qkey route
// param). Cosmetic otherwise: --as-* tokens, no hardcoded hex, 44px+ tap targets.

const SR_ONLY = { position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap' };

const cardStyle = {
  backgroundColor: 'var(--as-bg-card)', border: '1px solid var(--as-border-default)',
  borderRadius: 10, boxShadow: 'var(--as-shadow-sm)', padding: 16, minHeight: 44,
};
const titleStyle = { fontSize: 15, fontWeight: 600, lineHeight: 1.3, color: 'var(--as-text-primary)', margin: 0 };
const metaStyle = { margin: '4px 0 0', fontSize: 13, color: 'var(--as-text-tertiary)' };
const sectionLabel = { margin: '0 0 8px', fontSize: 11, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--as-text-tertiary)' };

function genderLabel(g) {
  if (g === 'M' || g === 'B') return 'Boys';
  if (g === 'F' || g === 'W' || g === 'G') return 'Girls';
  return null;
}

function LiveDot() {
  return <span aria-label="live now" title="Live now" style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 9999, backgroundColor: 'var(--as-danger)', marginRight: 6, verticalAlign: 'middle' }} />;
}

function Section({ label, children }) {
  return (
    <section style={{ marginTop: 20 }}>
      <h2 style={sectionLabel}>{label}</h2>
      <div style={{ display: 'grid', gap: 8 }}>{children}</div>
    </section>
  );
}

export default function AauSearchResults({ results }) {
  const teams = results?.teams || [];
  const divisions = results?.divisions || [];
  const tournaments = results?.tournaments || [];
  const total = teams.length + divisions.length + tournaments.length;

  if (total === 0) {
    return (
      <div style={{ ...cardStyle, textAlign: 'center' }}>
        <p style={{ margin: 0, fontSize: 15, color: 'var(--as-text-secondary)' }}>
          No matches yet — try a team name, grade, or tournament.
        </p>
      </div>
    );
  }

  return (
    <div>
      <p role="status" aria-live="polite" style={SR_ONLY}>{total} result{total !== 1 ? 's' : ''} found.</p>

      {/* Tournaments first — a parent searching a tournament name shouldn't have
          to scroll past a long team list to find it. */}
      {tournaments.length > 0 && (
        <Section label={`Tournaments · ${tournaments.length}`}>
          {tournaments.map((t, i) => {
            const meta = [t.circuit, t.divisionCount ? `${t.divisionCount} division${t.divisionCount !== 1 ? 's' : ''}` : null].filter(Boolean).join(' · ');
            const key = t.tournamentId || `${t.name}-${i}`;
            const inner = (
              <>
                <p style={titleStyle}>{t.isLive && <LiveDot />}{t.name || 'Tournament'}</p>
                {meta && <p style={metaStyle}>{meta}</p>}
              </>
            );
            return t.tournamentId ? (
              <Link key={key} to={`/hub/tournament/${t.tournamentId}`}
                aria-label={`${t.name || 'Tournament'} divisions`}
                style={{ ...cardStyle, display: 'block', textDecoration: 'none' }}>
                {inner}
              </Link>
            ) : (
              <article key={key} style={cardStyle}>{inner}</article>
            );
          })}
        </Section>
      )}

      {teams.length > 0 && (
        <Section label={`Teams · ${teams.length}`}>
          {teams.map((t, i) => {
            const g = genderLabel(t.gender);
            const meta = [t.gradeLabel && g ? `${g} · ${t.gradeLabel}` : (t.gradeLabel || g),
              t.record ? `${t.record.w ?? 0}–${t.record.l ?? 0}` : null].filter(Boolean).join('  ·  ');
            const sub = [t.tournamentName, t.divisionName].filter(Boolean).join(' · ');
            const key = t.teamKey || `${t.name}-${i}`;
            const inner = (
              <>
                <p style={titleStyle}>{t.isLive && <LiveDot />}{t.name || 'Team'}</p>
                {meta && <p style={metaStyle}>{meta}</p>}
                {sub && <p style={metaStyle}>{sub}</p>}
              </>
            );
            // teamKey IS the qkey the schedule route resolves; without it there's
            // no stable handle to navigate by, so render a non-link card.
            return t.teamKey ? (
              <Link key={key} to={`/hub/team/${encodeURIComponent(t.teamKey)}`}
                aria-label={`${t.name || 'Team'} schedule`}
                style={{ ...cardStyle, display: 'block', textDecoration: 'none' }}>
                {inner}
              </Link>
            ) : (
              <article key={key} style={cardStyle}>{inner}</article>
            );
          })}
        </Section>
      )}

      {divisions.length > 0 && (
        <Section label={`Divisions · ${divisions.length}`}>
          {divisions.map((d, i) => {
            const meta = [d.tournamentName, d.teamCount ? `${d.teamCount} team${d.teamCount !== 1 ? 's' : ''}` : null].filter(Boolean).join(' · ');
            return (
              <article key={d.divisionId || `${d.label}-${i}`} style={cardStyle}>
                <p style={titleStyle}>{d.divisionName || d.label || 'Division'}</p>
                {meta && <p style={metaStyle}>{meta}</p>}
              </article>
            );
          })}
        </Section>
      )}
    </div>
  );
}

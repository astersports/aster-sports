import { Link, useParams } from 'react-router-dom';
import { useAauTeamSchedule } from '../hooks/useAauTeamSchedule';
import AauGameCard from '../components/aau-hub/AauGameCard';
import PoweredByFooter from '../components/shared/PoweredByFooter';

// R1·PR-A — a team's public schedule on the no-login Hub gateway. Reached from
// a search_public_aau() team result (the teamKey is the qkey route param).
// Shows the team's games across all its tournaments, Upcoming then Results,
// each with venue directions. Non-shell, anon, mirrors the Hub page pattern.

const SR_ONLY = { position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap' };
const sectionLabel = { margin: '20px 0 8px', fontSize: 11, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--as-text-tertiary)' };

function Notice({ children }) {
  return (
    <div style={{ backgroundColor: 'var(--as-bg-card)', border: '1px solid var(--as-border-default)', borderRadius: 10, padding: 24, textAlign: 'center' }}>
      <p style={{ margin: 0, fontSize: 15, color: 'var(--as-text-secondary)' }}>{children}</p>
    </div>
  );
}

function Skeletons() {
  return (
    <div role="status" aria-live="polite" style={{ display: 'grid', gap: 12 }}>
      {[0, 1, 2].map((i) => <div key={i} style={{ height: 120, borderRadius: 10, backgroundColor: 'var(--as-bg-secondary)' }} />)}
      <span style={SR_ONLY}>Loading schedule…</span>
    </div>
  );
}

export default function AauTeamSchedulePage() {
  const { teamKey } = useParams();
  const { games, teamName, loading, error } = useAauTeamSchedule(teamKey);

  const upcoming = games.filter((g) => g.status !== 'final');
  const results = games.filter((g) => g.status === 'final').reverse(); // most recent first

  return (
    <main style={{ maxWidth: 600, margin: '0 auto', padding: '16px 16px 80px', backgroundColor: 'var(--as-bg-page)', minHeight: '100vh' }}>
      <Link to="/hub" style={{ display: 'inline-block', fontSize: 13, fontWeight: 500, color: 'var(--as-accent)', textDecoration: 'none', padding: '4px 0' }}>
        ← AAU Hub
      </Link>
      <header style={{ padding: '4px 0 8px' }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, lineHeight: 1.2, letterSpacing: '-0.02em', color: 'var(--as-text-primary)' }}>
          {teamName || 'Team schedule'}
        </h1>
      </header>

      {loading && <Skeletons />}
      {!loading && error && <Notice>Couldn’t reach the server. Try again in a moment.</Notice>}
      {!loading && !error && games.length === 0 && <Notice>No games found for this team yet — check back soon.</Notice>}

      {!loading && !error && games.length > 0 && (
        <>
          <p role="status" aria-live="polite" style={SR_ONLY}>
            {games.length} game{games.length !== 1 ? 's' : ''} loaded for {teamName || 'this team'}.
          </p>
          {upcoming.length > 0 && (
            <section>
              <h2 style={sectionLabel}>Upcoming · {upcoming.length}</h2>
              <div style={{ display: 'grid', gap: 12 }}>
                {upcoming.map((g) => <AauGameCard key={g.gameId} game={g} />)}
              </div>
            </section>
          )}
          {results.length > 0 && (
            <section>
              <h2 style={sectionLabel}>Results · {results.length}</h2>
              <div style={{ display: 'grid', gap: 12 }}>
                {results.map((g) => <AauGameCard key={g.gameId} game={g} />)}
              </div>
            </section>
          )}
        </>
      )}

      <PoweredByFooter links />
    </main>
  );
}

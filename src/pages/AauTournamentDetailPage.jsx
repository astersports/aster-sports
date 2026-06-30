import { Link, useParams } from 'react-router-dom';
import { useAauTournament } from '../hooks/useAauTournament';
import { usePlatformBrand } from '../hooks/usePlatformBrand';
import AauHubHeader from '../components/aau-hub/AauHubHeader';
import AauDivisionCard from '../components/aau-hub/AauDivisionCard';
import PoweredByFooter from '../components/shared/PoweredByFooter';

// R1·PR-A — a tournament's public detail on the no-login Hub. Reached from a
// directory or search tournament card. Shows the tournament's divisions (with
// team counts + advance cutoff); the ranked standings + brackets inside each
// division are PR-B (server-side compute, held). Non-shell, anon.

const SR_ONLY = { position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap' };

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
      {[0, 1, 2].map((i) => <div key={i} style={{ height: 64, borderRadius: 10, backgroundColor: 'var(--as-bg-secondary)' }} />)}
      <span style={SR_ONLY}>Loading tournament…</span>
    </div>
  );
}

export default function AauTournamentDetailPage() {
  usePlatformBrand();
  const { tournamentId } = useParams();
  const { tournament, divisions, loading, error } = useAauTournament(tournamentId);

  const title = tournament?.name || 'Tournament';
  const sub = [tournament?.circuit, Array.isArray(tournament?.states) ? tournament.states.join(', ') : null].filter(Boolean).join(' · ');

  return (
    <>
      <AauHubHeader />
      <main style={{ maxWidth: 600, margin: '0 auto', padding: '16px 16px 80px', backgroundColor: 'var(--as-bg-page)', minHeight: '100vh' }}>
      <Link to="/hub" style={{ display: 'inline-block', fontSize: 13, fontWeight: 500, color: 'var(--as-accent)', textDecoration: 'none', padding: '4px 0' }}>
        ← AAU Hub
      </Link>
      <header style={{ padding: '4px 0 8px' }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, lineHeight: 1.2, letterSpacing: '-0.02em', color: 'var(--as-text-primary)' }}>
          {loading ? 'Tournament' : title}
        </h1>
        {!loading && sub && <p style={{ margin: '6px 0 0', fontSize: 15, color: 'var(--as-text-secondary)' }}>{sub}</p>}
      </header>

      {loading && <Skeletons />}
      {!loading && error && <Notice>Couldn’t reach the server. Try again in a moment.</Notice>}
      {!loading && !error && divisions.length === 0 && <Notice>No divisions listed for this tournament yet.</Notice>}

      {!loading && !error && divisions.length > 0 && (
        <>
          <h2 style={{ margin: '20px 0 8px', fontSize: 11, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--as-text-tertiary)' }}>
            Divisions · {divisions.length}
          </h2>
          <div style={{ display: 'grid', gap: 12 }}>
            {divisions.map((d) => (
              <Link key={d.id || d.name} to={`/hub/tournament/${tournamentId}/division/${d.id}`}
                aria-label={`${d.name || 'Division'} — standings, schedule, bracket`}
                style={{ display: 'block', textDecoration: 'none' }}>
                <AauDivisionCard division={d} />
              </Link>
            ))}
          </div>
        </>
      )}

      <PoweredByFooter links />
      </main>
    </>
  );
}

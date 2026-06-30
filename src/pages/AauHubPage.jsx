import { useAauDirectory } from '../hooks/useAauDirectory';
import AauTournamentCard from '../components/aau-hub/AauTournamentCard';
import PoweredByFooter from '../components/shared/PoweredByFooter';

// R1·PR-A — the no-login AAU Hub gateway, mounted inside aster-sports
// (astersports.app) as the free parent acquisition wedge. No shell, no auth
// guard, anon Supabase client over the frozen public-RPC contract. This first
// brick proves the gateway renders here; standings/bracket/up-next ride later
// PR-A/PR-B increments. Mirrors the PublicSchedulePage non-shell page pattern.

const SR_ONLY = { position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap' };

export default function AauHubPage() {
  const { tournaments, loading, error } = useAauDirectory();

  return (
    <main style={{ maxWidth: 600, margin: '0 auto', padding: '16px 16px 80px', backgroundColor: 'var(--as-bg-page)', minHeight: '100vh' }}>
      <header style={{ padding: '8px 0 16px' }}>
        <p style={{ margin: 0, fontSize: 11, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--as-text-tertiary)' }}>
          AAU Hub
        </p>
        <h1 style={{ margin: '4px 0 0', fontSize: 24, fontWeight: 700, lineHeight: 1.2, letterSpacing: '-0.02em', color: 'var(--as-text-primary)' }}>
          Tournaments
        </h1>
        <p style={{ margin: '6px 0 0', fontSize: 15, lineHeight: 1.5, color: 'var(--as-text-secondary)' }}>
          Live brackets, standings, and schedules — free, no account needed.
        </p>
      </header>

      {loading && (
        <div role="status" aria-live="polite" style={{ display: 'grid', gap: 12 }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ height: 76, borderRadius: 10, backgroundColor: 'var(--as-bg-secondary)' }} />
          ))}
          <span style={SR_ONLY}>Loading tournaments…</span>
        </div>
      )}

      {!loading && error && (
        <div style={{ backgroundColor: 'var(--as-bg-card)', border: '1px solid var(--as-border-default)', borderRadius: 10, padding: 24, textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: 15, color: 'var(--as-text-secondary)' }}>
            Couldn’t reach the server. Try again in a moment.
          </p>
        </div>
      )}

      {!loading && !error && tournaments.length === 0 && (
        <div style={{ backgroundColor: 'var(--as-bg-card)', border: '1px solid var(--as-border-default)', borderRadius: 10, padding: 24, textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: 15, color: 'var(--as-text-secondary)' }}>
            No tournaments listed yet — check back soon.
          </p>
        </div>
      )}

      {!loading && !error && tournaments.length > 0 && (
        <>
          <p role="status" aria-live="polite" style={SR_ONLY}>
            {tournaments.length} tournament{tournaments.length !== 1 ? 's' : ''} loaded.
          </p>
          <div style={{ display: 'grid', gap: 12 }}>
            {tournaments.map((t) => (
              <AauTournamentCard key={t.id} tournament={t} />
            ))}
          </div>
        </>
      )}

      <PoweredByFooter links />
    </main>
  );
}

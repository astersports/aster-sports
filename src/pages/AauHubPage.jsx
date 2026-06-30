import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAauDirectory } from '../hooks/useAauDirectory';
import { useAauSearch } from '../hooks/useAauSearch';
import { usePlatformBrand } from '../hooks/usePlatformBrand';
import AauTournamentCard from '../components/aau-hub/AauTournamentCard';
import AauTrackedTeams from '../components/aau-hub/AauTrackedTeams';
import AauSearchResults from '../components/aau-hub/AauSearchResults';
import PoweredByFooter from '../components/shared/PoweredByFooter';

// R1·PR-A — the no-login AAU Hub gateway, mounted inside aster-sports
// (astersports.app) as the free parent acquisition wedge. No shell, no auth
// guard, anon Supabase client over the frozen public-RPC contract. Browse the
// tournament directory, or search to find a team / tournament. Standings,
// bracket, and up-next ride later PR-A/PR-B increments.

const SR_ONLY = { position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap' };

function Skeletons() {
  return (
    <div role="status" aria-live="polite" style={{ display: 'grid', gap: 12 }}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ height: 76, borderRadius: 10, backgroundColor: 'var(--as-bg-secondary)' }} />
      ))}
      <span style={SR_ONLY}>Loading…</span>
    </div>
  );
}

function Notice({ children }) {
  return (
    <div style={{ backgroundColor: 'var(--as-bg-card)', border: '1px solid var(--as-border-default)', borderRadius: 10, padding: 24, textAlign: 'center' }}>
      <p style={{ margin: 0, fontSize: 15, color: 'var(--as-text-secondary)' }}>{children}</p>
    </div>
  );
}

export default function AauHubPage() {
  usePlatformBrand();
  const [query, setQuery] = useState('');
  const { tournaments, loading, error } = useAauDirectory();
  const search = useAauSearch(query);

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

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search teams, tournaments…"
        aria-label="Search AAU teams and tournaments"
        style={{ width: '100%', height: 44, padding: '0 14px', fontSize: 15, color: 'var(--as-text-primary)', backgroundColor: 'var(--as-bg-tertiary)', border: '1.5px solid var(--as-border-default)', borderRadius: 10, outline: 'none', boxSizing: 'border-box' }}
      />

      {search.active ? (
        <div style={{ marginTop: 4 }}>
          {search.loading && <div style={{ marginTop: 16 }}><Skeletons /></div>}
          {!search.loading && search.error && <div style={{ marginTop: 16 }}><Notice>Couldn’t reach the server. Try again in a moment.</Notice></div>}
          {!search.loading && !search.error && <AauSearchResults results={search.results} />}
        </div>
      ) : (
        <div style={{ marginTop: 20 }}>
          <AauTrackedTeams />
          {loading && <Skeletons />}
          {!loading && error && <Notice>Couldn’t reach the server. Try again in a moment.</Notice>}
          {!loading && !error && tournaments.length === 0 && <Notice>No tournaments listed yet — check back soon.</Notice>}
          {!loading && !error && tournaments.length > 0 && (
            <>
              <p role="status" aria-live="polite" style={SR_ONLY}>
                {tournaments.length} tournament{tournaments.length !== 1 ? 's' : ''} loaded.
              </p>
              <h2 style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--as-text-tertiary)' }}>
                All tournaments
              </h2>
              <div style={{ display: 'grid', gap: 12 }}>
                {tournaments.map((t) => (
                  <Link key={t.id} to={`/hub/tournament/${t.id}`} aria-label={`${t.name || 'Tournament'} divisions`} style={{ display: 'block', textDecoration: 'none' }}>
                    <AauTournamentCard tournament={t} />
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      <PoweredByFooter links />
    </main>
  );
}

import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAauTournament } from '../hooks/useAauTournament';
import { useAauTournamentGames } from '../hooks/useAauTournamentGames';
import { usePlatformBrand } from '../hooks/usePlatformBrand';
import AauHubHeader from '../components/aau-hub/AauHubHeader';
import AauFilterPills from '../components/aau-hub/AauFilterPills';
import AauStandingsTable from '../components/aau-hub/AauStandingsTable';
import AauGameDayList from '../components/aau-hub/AauGameDayList';
import PoweredByFooter from '../components/shared/PoweredByFooter';
import { groupTeamsByPool } from '../lib/aau/divisionPools';

// R1·PR-A — one division (gender/grade) on the no-login Hub, mirroring the source
// bracket app: tap a division on a tournament → Standings (by pool, W/L/PD/PA/PS)
// / Schedule / Bracket tabs. Standings come from get_public_tournament_teams (pool
// + records + team_key); the schedule/bracket from get_public_tournament_games,
// filtered to this division. Anon, non-shell.

const main = { maxWidth: 600, margin: '0 auto', padding: '16px 16px 80px', backgroundColor: 'var(--as-bg-page)', minHeight: '100vh' };
const backLink = { display: 'inline-block', fontSize: 13, fontWeight: 500, color: 'var(--as-accent)', textDecoration: 'none', padding: '4px 0' };

function Notice({ children }) {
  return <div style={{ backgroundColor: 'var(--as-bg-card)', border: '1px solid var(--as-border-default)', borderRadius: 10, padding: 24, textAlign: 'center' }}><p style={{ margin: 0, fontSize: 15, color: 'var(--as-text-secondary)' }}>{children}</p></div>;
}
function Skeletons() {
  return <div role="status" aria-live="polite" style={{ display: 'grid', gap: 12 }}>{[0, 1, 2].map((i) => <div key={i} style={{ height: 64, borderRadius: 10, backgroundColor: 'var(--as-bg-secondary)' }} />)}</div>;
}

export default function AauDivisionDetailPage() {
  usePlatformBrand();
  const { tournamentId, divisionId } = useParams();
  const { divisions, loading, error } = useAauTournament(tournamentId);
  const { games, loading: gamesLoading, error: gamesError } = useAauTournamentGames(tournamentId);
  const [tab, setTab] = useState('standings');

  const division = divisions.find((d) => d.id === divisionId) || null;
  const pools = groupTeamsByPool(division?.teams || []);
  const divGames = games.filter((g) => g.divisionId === divisionId);
  const bracketGames = divGames.filter((g) => g.isBracket);

  const tabs = [
    { key: 'standings', label: 'Standings' },
    { key: 'schedule', label: 'Schedule', count: divGames.length || undefined },
    ...(bracketGames.length ? [{ key: 'bracket', label: 'Bracket', count: bracketGames.length }] : []),
  ];
  const active = tabs.some((t) => t.key === tab) ? tab : 'standings';

  return (
    <>
      <AauHubHeader />
      <main style={main}>
        <Link to={`/hub/tournament/${tournamentId}`} style={backLink}>← Divisions</Link>
        <h1 style={{ margin: '4px 0 12px', fontSize: 24, fontWeight: 700, lineHeight: 1.2, letterSpacing: '-0.02em', color: 'var(--as-text-primary)' }}>
          {division?.name || 'Division'}
        </h1>

        {loading && <Skeletons />}
        {!loading && (error || !division) && <Notice>Couldn’t load this division. Try again in a moment.</Notice>}

        {!loading && division && (
          <>
            <AauFilterPills options={tabs} value={active} onChange={setTab} ariaLabel="Division view" />
            <div style={{ marginTop: 8 }}>
              {active === 'standings' && (pools.length > 0
                ? pools.map((p, i) => <AauStandingsTable key={p.pool || i} pool={pools.length > 1 ? p.pool : null} teams={p.teams} />)
                : <Notice>Standings post once games are played.</Notice>)}
              {active === 'schedule' && (gamesLoading ? <Skeletons />
                : gamesError ? <Notice>Couldn’t load the schedule. Try again in a moment.</Notice>
                : <AauGameDayList games={divGames} emptyText="No games scheduled yet — check back soon." />)}
              {active === 'bracket' && (gamesError ? <Notice>Couldn’t load the bracket. Try again in a moment.</Notice>
                : <AauGameDayList games={bracketGames} emptyText="Bracket isn’t set yet." />)}
            </div>
          </>
        )}

        <PoweredByFooter links />
      </main>
    </>
  );
}

import { useMemo, useState } from 'react';
import { SearchX, Users } from 'lucide-react';
import { useActiveSeasonTeams } from '../hooks/useActiveSeasonTeams';
import { useSeason } from '../context/SeasonContext';
import { useAuth } from '../context/AuthContext';
import { useDensity } from '../hooks/useDensity';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import { useOrgTeamRecords } from '../hooks/useOrgTeamRecords';
import EmptyState from '../components/shared/EmptyState';
import LoadingSkeleton from '../components/shared/LoadingSkeleton';
import TeamRow from '../components/teams/TeamRow';
import TeamsListHeader from '../components/teams/TeamsListHeader';
import TeamsSearchBar, { TYPEAHEAD_THRESHOLD } from '../components/teams/TeamsSearchBar';
import TeamsErrorState from '../components/teams/TeamsErrorState';

const CIRCUIT_LABELS = { aau: 'AAU', league_play: 'League Play', tournament: 'Tournament' };

// Public teams list. Every signed-in user — admin, coach, parent — sees
// all teams in the active season, sorted oldest-to-youngest via the
// useActiveSeasonTeams() sort_order query. Tapping a card routes to
// /teams/:teamId where the roster lives. Search + circuit filter appear
// once the list passes TYPEAHEAD_THRESHOLD; density toggles card spacing.
export default function TeamsPage() {
  const { activeSeason } = useSeason();
  const { role, myTeamIds, orgId } = useAuth();
  const { teams, loading, error, refetch } = useActiveSeasonTeams();
  const { byTeamId, error: recordsError, refetch: refetchRecords } = useOrgTeamRecords(orgId);
  const { density, cycleDensity } = useDensity('teams_list');
  const { refreshing, onTouchStart, onTouchEnd } = usePullToRefresh(
    () => Promise.all([refetch?.(), refetchRecords?.()])
  );

  const [search, setSearch] = useState('');
  const [circuit, setCircuit] = useState('all');

  const visibleTeams = useMemo(
    () => (role === 'parent' ? teams.filter((t) => (myTeamIds || []).includes(t.id)) : teams),
    [role, teams, myTeamIds]
  );

  // Circuit filter chips — derived from the teams actually present so a
  // chip never shows for a circuit no team uses.
  const circuits = useMemo(() => {
    const seen = new Map();
    for (const t of visibleTeams) {
      if (t.circuit && !seen.has(t.circuit)) {
        seen.set(t.circuit, CIRCUIT_LABELS[t.circuit] || t.circuit);
      }
    }
    return [...seen].map(([key, label]) => ({ key, label }));
  }, [visibleTeams]);

  const filteredTeams = useMemo(() => {
    const q = search.trim().toLowerCase();
    return visibleTeams.filter((t) => {
      if (circuit !== 'all' && t.circuit !== circuit) return false;
      if (q && !(t.name || '').toLowerCase().includes(q)) return false;
      return true;
    });
  }, [visibleTeams, search, circuit]);

  const showControls = visibleTeams.length >= TYPEAHEAD_THRESHOLD;
  const cardGap = density === 'minimal' ? 8 : 12;

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      className="px-4 py-4 as-fade-in overflow-x-hidden"
      style={{ maxWidth: '100%' }}
    >
      <TeamsListHeader
        seasonName={activeSeason?.name}
        shown={filteredTeams.length}
        total={visibleTeams.length}
        density={density}
        onToggleDensity={cycleDensity}
      />

      {refreshing && (
        <div className="flex justify-center py-3" role="status" aria-label="Refreshing teams">
          <div style={{
            width: 24, height: 24, borderRadius: '50%',
            border: '2px solid var(--as-accent)', borderTopColor: 'transparent',
            animation: 'spin 0.6s linear infinite',
          }} />
        </div>
      )}

      {!loading && (error || recordsError) ? (
        <TeamsErrorState onRetry={() => Promise.all([refetch?.(), refetchRecords?.()])} />
      ) : loading ? (
        <LoadingSkeleton variant="card" count={5} />
      ) : visibleTeams.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No teams yet"
          description={
            role === 'parent'
              ? "Your kids aren't on a roster yet — your admin will add them soon."
              : 'Teams will show up here once your admin gets things rolling.'
          }
        />
      ) : (
        <>
          {showControls && (
            <TeamsSearchBar
              search={search}
              onSearch={setSearch}
              circuits={circuits}
              circuit={circuit}
              onCircuit={setCircuit}
              total={visibleTeams.length}
            />
          )}

          {/* Polite live region so screen readers hear the result count
              update as the user types / filters. */}
          <p className="as-sr-only" role="status" aria-live="polite">
            {filteredTeams.length} {filteredTeams.length === 1 ? 'team' : 'teams'} shown
          </p>

          {filteredTeams.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title="No teams match"
              description="Try a different name or circuit — or clear the filters to see them all."
            />
          ) : (
            <div className="flex flex-col" style={{ gap: cardGap }}>
              {filteredTeams.map((team, i) => (
                <TeamRow key={team.id} team={team} idx={i} summary={byTeamId[team.id]} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

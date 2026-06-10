import { Users } from 'lucide-react';
import { useActiveSeasonTeams } from '../hooks/useActiveSeasonTeams';
import { useSeason } from '../context/SeasonContext';
import { useAuth } from '../context/AuthContext';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import { useOrgTeamRecords } from '../hooks/useOrgTeamRecords';
import EmptyState from '../components/shared/EmptyState';
import LoadingSkeleton from '../components/shared/LoadingSkeleton';
import TeamRow from '../components/teams/TeamRow';

// Public teams list. Every signed-in user — admin, coach, parent — sees
// all teams in the active season, sorted oldest-to-youngest via the
// useActiveSeasonTeams() sort_order query. Tapping a card routes to
// /teams/:teamId where the roster lives.
export default function TeamsPage() {
  const { activeSeason } = useSeason();
  const { role, myTeamIds, orgId } = useAuth();
  const { teams, loading, refetch } = useActiveSeasonTeams();
  const { byTeamId, refetch: refetchRecords } = useOrgTeamRecords(orgId);
  const { refreshing, onTouchStart, onTouchEnd } = usePullToRefresh(() => Promise.all([refetch?.(), refetchRecords?.()]));
  const visibleTeams = role === 'parent' ? teams.filter((t) => (myTeamIds || []).includes(t.id)) : teams;

  return (
    <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} className="px-4 py-4 as-fade-in overflow-x-hidden" style={{ maxWidth: '100%' }}>
      <div style={{ marginBottom: 4 }}>
        <h1 className="font-bold" style={{ color: 'var(--as-text-primary)', fontSize: 20, letterSpacing: '-0.025em' }}>
          Teams <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--as-text-tertiary)' }}>{activeSeason?.name || ''} · {visibleTeams.length}</span>
        </h1>
        <div style={{ width: 32, height: 3, borderRadius: 999, backgroundColor: 'var(--as-accent)', marginTop: 6 }} />
      </div>

      {refreshing && (
        <div className="flex justify-center py-3">
          <div style={{
            width: 24, height: 24, borderRadius: '50%',
            border: '2px solid var(--as-accent)',
            borderTopColor: 'transparent',
            animation: 'spin 0.6s linear infinite',
          }} />
        </div>
      )}

      {loading ? (
        <LoadingSkeleton variant="card" count={5} />
      ) : visibleTeams.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No teams yet"
          description="Teams will show up here once your admin gets things rolling."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {visibleTeams.map((team, i) => (
            <TeamRow key={team.id} team={team} idx={i} summary={byTeamId[team.id]} />
          ))}
        </div>
      )}
    </div>
  );
}

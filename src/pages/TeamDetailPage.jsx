import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, Users } from 'lucide-react';
import { usePrograms } from '../hooks/usePrograms';
import { useRoster } from '../hooks/useRoster';
import EmptyState from '../components/shared/EmptyState';
import LoadingSkeleton from '../components/shared/LoadingSkeleton';
import PlayerRow from '../components/roster/PlayerRow';
import TeamHeaderCard from '../components/roster/TeamHeaderCard';

// Read-only roster view for a single team. The team lookup piggybacks on
// usePrograms() — it already queries every team in the active season, so
// we don't pay a second round-trip for a single row. Roster data comes
// from the seed hook until the real tables are populated.
export default function TeamDetailPage() {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const { programs, loading: teamsLoading } = usePrograms();
  const { players, loading: rosterLoading } = useRoster(teamId);
  // useRoster already returns players sorted by jersey ascending (null
  // jerseys sink); this alias keeps the JSX readable while leaving the
  // sort logic centralized in the hook.
  const sortedPlayers = players;

  const team = programs.find((p) => p.id === teamId);

  if (teamsLoading) {
    return (
      <div className="px-4 py-4">
        <LoadingSkeleton variant="card" count={3} />
      </div>
    );
  }

  if (!team) {
    return (
      <div className="px-4 py-4">
        <EmptyState
          icon={Users}
          title="Team not found"
          description="This team doesn't exist or has been removed."
        />
      </div>
    );
  }

  return (
    <div className="px-4 py-4 sf-fade-in overflow-x-hidden" style={{ maxWidth: '100%' }}>
      <button
        type="button"
        onClick={() => navigate('/teams')}
        className="flex items-center sf-press mb-3"
        style={{
          minHeight: 44, padding: '0 8px 0 0', background: 'none', border: 'none',
          color: 'var(--sf-accent)', fontSize: 15, fontWeight: 500,
        }}
      >
        <ChevronLeft size={20} strokeWidth={1.75} aria-hidden="true" /> Teams
      </button>

      <TeamHeaderCard team={team} players={players} />

      {rosterLoading ? (
        <LoadingSkeleton variant="list" count={6} />
      ) : players.length === 0 ? (
        <EmptyState
          icon={Users}
          title={`No players on ${team.name} yet`}
          action={
            <button
              type="button"
              className="flex items-center gap-1 font-semibold sf-press"
              style={{
                minHeight: 44, padding: '0 14px', borderRadius: 10,
                backgroundColor: 'var(--sf-accent)', color: 'var(--sf-text-inverse)', fontSize: 14,
              }}
            >
              <Plus size={18} strokeWidth={1.75} aria-hidden="true" /> Add Player
            </button>
          }
        />
      ) : (
        <>
          <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
            <div style={{
              fontSize: 11, fontWeight: 600, letterSpacing: '0.05em',
              textTransform: 'uppercase', color: 'var(--sf-text-tertiary)',
            }}>ROSTER</div>
          </div>
          <div style={{
            backgroundColor: 'var(--sf-bg-card)',
            borderRadius: 10,
            border: '1px solid var(--sf-border-default)',
            boxShadow: 'var(--sf-shadow-sm)',
            overflow: 'hidden',
          }}>
            {sortedPlayers.map((player, i) => (
              <div key={player.id} className={`sf-stagger-${Math.min(i + 1, 8)}`}>
                <PlayerRow
                  player={player}
                  teamColor={team.team_color}
                  isLast={i === sortedPlayers.length - 1}
                />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

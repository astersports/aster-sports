import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { isStaff } from '../lib/permissions';
import { usePrograms } from '../hooks/usePrograms';
import { useRoster } from '../hooks/useRoster';
import { useFilteredRoster } from '../hooks/useFilteredRoster';
import EmptyState from '../components/shared/EmptyState';
import LoadingSkeleton from '../components/shared/LoadingSkeleton';
import PlayerRow from '../components/roster/PlayerRow';
import TeamHeaderCard from '../components/roster/TeamHeaderCard';
import RosterControls from '../components/roster/RosterControls';
import CopyRosterButton from '../components/roster/CopyRosterButton';
import UpcomingEvents from '../components/roster/UpcomingEvents';
import MessageTeamFAB from '../components/roster/MessageTeamFAB';
import TeamSwitcher from '../components/roster/TeamSwitcher';

// Read-only roster view for a single team. The team lookup piggybacks on
// usePrograms() — it already queries every team in the active season, so
// we don't pay a second round-trip for a single row. Roster data comes
// from the seed hook until the real tables are populated.
export default function TeamDetailPage() {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const { role, myTeamIds } = useAuth();
  const { programs, loading: teamsLoading } = usePrograms();
  const switcherPrograms = role === 'parent' ? programs.filter((p) => (myTeamIds || []).includes(p.id)) : programs;
  const { players, loading: rosterLoading } = useRoster(teamId);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('jersey'); // 'jersey' | 'name' | 'grade'
  const sortedPlayers = useFilteredRoster(players, search, sortBy);

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
    <div
      className="sf-fade-in overflow-x-hidden"
      style={{
        padding: 16,
        minHeight: '100%',
        background: team?.team_color
          ? `linear-gradient(180deg, ${team.team_color}08 0%, transparent 200px)`
          : undefined,
      }}
    >
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

      <TeamSwitcher programs={switcherPrograms} teamId={teamId} navigate={navigate} />

      <TeamHeaderCard team={team} players={players} />

      {rosterLoading ? (
        <LoadingSkeleton variant="list" count={6} />
      ) : players.length === 0 ? (
        isStaff(role) ? (
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
          <EmptyState
            icon={Users}
            title="Roster not posted yet"
            description="The coach is still setting up this team's roster. Check back soon."
          />
        )
      ) : (
        <>
          <RosterControls
            search={search}
            setSearch={setSearch}
            sortBy={sortBy}
            setSortBy={setSortBy}
          />
          <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
            <div style={{
              fontSize: 11, fontWeight: 600, letterSpacing: '0.05em',
              textTransform: 'uppercase', color: 'var(--sf-text-tertiary)',
            }}>ROSTER</div>
            <CopyRosterButton team={team} sortedPlayers={sortedPlayers} />
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
          <UpcomingEvents />
        </>
      )}

      <MessageTeamFAB />
    </div>
  );
}

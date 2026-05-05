import { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { isStaff } from '../lib/permissions';
import { usePrograms } from '../hooks/usePrograms';
import { useRoster } from '../hooks/useRoster';
import { useFilteredRoster } from '../hooks/useFilteredRoster';
import { useAttendanceData } from '../hooks/useAttendanceData';
import { useTeamRecords } from '../hooks/useTeamRecords';
import { usePlayerSeasonStats } from '../hooks/usePlayerSeasonStats';
import EmptyState from '../components/shared/EmptyState';
import LoadingSkeleton from '../components/shared/LoadingSkeleton';
import TeamHeaderCard from '../components/roster/TeamHeaderCard';
import RosterSection from '../components/roster/RosterSection';
import TeamSwitcher from '../components/roster/TeamSwitcher';
import PlayerStatsTable from '../components/records/PlayerStatsTable';
import Label from '../components/shared/Label';

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
  const { grid } = useAttendanceData(teamId);
  const { summary, loading: recordsLoading } = useTeamRecords(teamId);
  const { stats: playerStats, loading: statsLoading } = usePlayerSeasonStats(teamId);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('jersey');
  const [showAvg, setShowAvg] = useState(false);
  const enrichedPlayers = useMemo(() => {
    if (!grid?.length) return players;
    const pctMap = {};
    grid.forEach((g) => { pctMap[g.player.id] = g.pct; });
    return players.map((p) => ({ ...p, attendance_pct: pctMap[p.id] ?? null }));
  }, [players, grid]);
  const sortedPlayers = useFilteredRoster(enrichedPlayers, search, sortBy);

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
          color: 'var(--em-accent)', fontSize: 15, fontWeight: 500,
        }}
      >
        <ChevronLeft size={20} strokeWidth={1.75} aria-hidden="true" /> Teams
      </button>

      <TeamSwitcher programs={switcherPrograms} teamId={teamId} navigate={navigate} />

      <TeamHeaderCard team={team} summary={summary} loading={recordsLoading} />

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
                  backgroundColor: 'var(--em-accent)', color: 'var(--em-text-inverse)', fontSize: 14,
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
        <RosterSection
          team={team}
          sortedPlayers={sortedPlayers}
          search={search}
          setSearch={setSearch}
          sortBy={sortBy}
          setSortBy={setSortBy}
        />
      )}

      {!rosterLoading && players.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <Label>Player Stats</Label>
            <button type="button" onClick={() => setShowAvg((v) => !v)} className="sf-press" style={{ minHeight: 32, padding: '0 10px', borderRadius: 9999, fontSize: 11, fontWeight: 500, border: '1px solid var(--em-border-default)', backgroundColor: showAvg ? 'var(--em-accent)' : 'var(--em-bg-card)', color: showAvg ? 'var(--em-text-inverse)' : 'var(--em-text-secondary)' }}>
              {showAvg ? 'Per Game' : 'Totals'}
            </button>
          </div>
          <div style={{ backgroundColor: 'var(--em-bg-card)', borderRadius: 10, border: '1px solid var(--em-border-default)', overflow: 'hidden' }}>
            {statsLoading ? <LoadingSkeleton variant="list" count={3} /> : <PlayerStatsTable players={players} stats={playerStats} showAvg={showAvg} />}
          </div>
        </div>
      )}
    </div>
  );
}

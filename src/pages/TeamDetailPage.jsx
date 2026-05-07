import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Users } from 'lucide-react';
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
import TeamAchievements from '../components/roster/TeamAchievements';
import RosterSection from '../components/roster/RosterSection';
import TeamSwitcher from '../components/roster/TeamSwitcher';
import TeamPlayerStats from '../components/roster/TeamPlayerStats';
import TeamHeatmap from '../components/gameday/TeamHeatmap';
import MessageTeamFAB from '../components/roster/MessageTeamFAB';
import QrInviteButton from '../components/roster/QrInviteButton';

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
  const [pulseRange, setPulseRange] = useState('season');
  const enrichedPlayers = useMemo(() => {
    if (!grid?.length) return players;
    const pctMap = {};
    grid.forEach((g) => { pctMap[g.player.id] = g.pct; });
    return players.map((p) => ({ ...p, attendance_pct: pctMap[p.id] ?? null }));
  }, [players, grid]);
  const sortedPlayers = useFilteredRoster(enrichedPlayers, search, sortBy);
  const team = programs.find((p) => p.id === teamId);

  if (teamsLoading) return <div className="px-4 py-4"><LoadingSkeleton variant="card" count={3} /></div>;
  if (!team) return <div className="px-4 py-4"><EmptyState icon={Users} title="Team not found" description="This team doesn't exist or has been removed." /></div>;

  return (
    <div className="sf-fade-in overflow-x-hidden" style={{ padding: 16, minHeight: '100%', background: team?.team_color ? `linear-gradient(180deg, ${team.team_color}08 0%, transparent 200px)` : undefined }}>
      <button type="button" onClick={() => navigate('/teams')} className="flex items-center sf-press mb-2" style={{ minHeight: 44, padding: '0 8px 0 0', background: 'none', border: 'none', color: 'var(--em-accent)', fontSize: 15, fontWeight: 500 }}>
        <ChevronLeft size={20} strokeWidth={1.75} aria-hidden="true" /> Teams
      </button>
      <TeamSwitcher programs={switcherPrograms} teamId={teamId} navigate={navigate} />
      <TeamHeaderCard team={team} summary={summary} loading={recordsLoading} />
      <TeamAchievements teamId={teamId} />
      {isStaff(role) && <QrInviteButton teamId={teamId} teamName={team.name} />}

      {rosterLoading ? (
        <LoadingSkeleton variant="list" count={6} />
      ) : players.length === 0 ? (
        isStaff(role) ? (
          <EmptyState icon={Users} title={`No players on ${team.name} yet`} description="Players are added via the admin roster management tools." />
        ) : (
          <EmptyState icon={Users} title="Roster not posted yet" description="The coach is still setting up this team's roster. Check back soon." />
        )
      ) : (
        <RosterSection team={team} sortedPlayers={sortedPlayers} search={search} setSearch={setSearch} sortBy={sortBy} setSortBy={setSortBy} />
      )}

      {!rosterLoading && players.length > 0 && <TeamHeatmap teamId={teamId} teamColor={team?.team_color} range={pulseRange} onRangeToggle={() => setPulseRange(r => r === 'season' ? '4weeks' : 'season')} />}
      {!rosterLoading && players.length > 0 && <TeamPlayerStats players={players} stats={playerStats} loading={statsLoading} />}
      {isStaff(role) && <MessageTeamFAB teamId={teamId} />}
    </div>
  );
}

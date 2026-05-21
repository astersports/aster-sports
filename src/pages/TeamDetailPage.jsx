import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useHomeRole } from '../hooks/useHomeRole';
import { isStaff } from '../lib/permissions';
import { usePrograms } from '../hooks/usePrograms';
import { useRoster } from '../hooks/useRoster';
import { useFilteredRoster } from '../hooks/useFilteredRoster';
import { useAttendanceData } from '../hooks/useAttendanceData';
import { useTeamRecords } from '../hooks/useTeamRecords';
import { usePlayerSeasonStats } from '../hooks/usePlayerSeasonStats';
import { useActivities } from '../hooks/useActivities';
import { useNow } from '../hooks/useNow';
import { useRefetchOnVisible } from '../hooks/useRefetchOnVisible';
import EmptyState from '../components/shared/EmptyState';
import LoadingSkeleton from '../components/shared/LoadingSkeleton';
import CollapsibleSection from '../components/shared/CollapsibleSection';
import TeamDetailHero from '../components/roster/TeamDetailHero';
import TeamAchievements from '../components/roster/TeamAchievements';
import RosterSection from '../components/roster/RosterSection';
import TeamSwitcher from '../components/roster/TeamSwitcher';
import TeamPlayerStats from '../components/roster/TeamPlayerStats';
import TeamHeatmap from '../components/gameday/TeamHeatmap';
import UpcomingEvents from '../components/roster/UpcomingEvents';

export default function TeamDetailPage() {
  const { teamId } = useParams();
  const navigate = useNavigate();
  // 2026-05-21 (Teams PR A) — page-level render reads activeRole per
  // anti-pattern #42 (useHomeRole is the existing infra; don't build a
  // parallel role context). myTeamIds + myChildren still come from
  // useAuth — those are user-identity, not preview-affordance. Per
  // CLAUDE.md §16.14 follow-up: in-row permission checks (InviteButton
  // etc.) still read realRole via useAuth().
  const { myTeamIds, myChildren } = useAuth();
  const { activeRole } = useHomeRole();
  const role = activeRole;
  const { programs, loading: teamsLoading } = usePrograms();
  const switcherPrograms = role === 'parent' ? programs.filter((p) => (myTeamIds || []).includes(p.id)) : programs;
  const { players, loading: rosterLoading, refetch: rosterRefetch } = useRoster(teamId);
  useRefetchOnVisible(rosterRefetch);
  const { grid } = useAttendanceData(teamId);
  const { summary, loading: recordsLoading } = useTeamRecords(teamId);
  const { stats: playerStats, loading: statsLoading } = usePlayerSeasonStats(teamId);
  const { activities } = useActivities();
  const now = useNow();
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('jersey');
  const [pulseRange, setPulseRange] = useState('season');
  const enrichedPlayers = useMemo(() => {
    if (!grid?.length) return players;
    const statsMap = {};
    grid.forEach((g) => { statsMap[g.player.id] = g; });
    return players.map((p) => {
      const s = statsMap[p.id];
      if (!s) return p;
      return { ...p, attendance_pct: s.pct, goingCount: s.goingCount, maybeCount: s.maybeCount, declinedCount: s.declinedCount, noResponseCount: s.noResponseCount, totalPast: s.totalPast, streak: s.streak };
    });
  }, [players, grid]);
  const sortedPlayers = useFilteredRoster(enrichedPlayers, search, sortBy);
  const team = programs.find((p) => p.id === teamId);
  const nextEvent = useMemo(() =>
    (activities || []).filter(a => a.team_id === teamId && a.status !== 'cancelled' && a.start_at)
      .sort((a, b) => new Date(a.start_at) - new Date(b.start_at))
      .find(a => new Date(a.start_at).getTime() >= now),
    [activities, teamId, now]);
  const myChild = role === 'parent' ? (myChildren || []).find((c) => c.teamIds?.includes(teamId) || c.teamId === teamId) : null;
  const myChildPlayer = myChild ? enrichedPlayers.find((p) => p.id === myChild.playerId) : null;

  if (teamsLoading) return <div className="px-4 py-4"><LoadingSkeleton variant="card" count={3} /></div>;
  if (!team) return <div className="px-4 py-4"><EmptyState icon={Users} title="Team not found" description="This team doesn't exist or has been removed." /></div>;

  return (
    <div style={{ padding: 16, minHeight: '100%', background: team?.team_color ? `linear-gradient(180deg, ${team.team_color}08 0%, transparent 200px)` : undefined }}>
      <button type="button" onClick={() => navigate('/teams')} className="flex items-center sf-press mb-2" style={{ minHeight: 44, padding: '0 8px 0 0', background: 'none', border: 'none', color: 'var(--em-accent)', fontSize: 15, fontWeight: 500 }}>
        <ChevronLeft size={20} strokeWidth={1.75} aria-hidden="true" /> Teams
      </button>
      {switcherPrograms.length > 1 && <TeamSwitcher programs={switcherPrograms} teamId={teamId} navigate={navigate} />}
      {/* 2026-05-21 (Teams PR B / §16.14) — single hero replaces
          TeamHeaderCard + MyChildSpotlight + CoachQuickActions +
          the floating Send-briefing chip. MessageTeamFAB also retired
          (action lives inside the hero now). Everything below the hero
          is a collapsible section per the detail-page contract. */}
      <TeamDetailHero team={team} role={role} summary={recordsLoading ? null : summary} myChild={myChild} myChildPlayer={myChildPlayer} nextEvent={nextEvent} />
      <CollapsibleSection title="Upcoming" subtitle="next 7 days">
        <UpcomingEvents teamId={teamId} />
      </CollapsibleSection>

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

      {!rosterLoading && players.length > 0 && <TeamHeatmap teamId={teamId} range={pulseRange} onRangeToggle={() => setPulseRange((r) => r === 'season' ? '4weeks' : 'season')} />}
      {!rosterLoading && players.length > 0 && isStaff(role) && <TeamPlayerStats players={players} stats={playerStats} loading={statsLoading} />}
      <TeamAchievements teamId={teamId} />
    </div>
  );
}

import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Mail, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
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
import TeamHeaderCard from '../components/roster/TeamHeaderCard';
import TeamAchievements from '../components/roster/TeamAchievements';
import RosterSection from '../components/roster/RosterSection';
import TeamSwitcher from '../components/roster/TeamSwitcher';
import TeamPlayerStats from '../components/roster/TeamPlayerStats';
import TeamHeatmap from '../components/gameday/TeamHeatmap';
import MessageTeamFAB from '../components/roster/MessageTeamFAB';
import CoachQuickActions from '../components/roster/CoachQuickActions';
import MyChildSpotlight from '../components/roster/MyChildSpotlight';
import UpcomingEvents from '../components/roster/UpcomingEvents';

export default function TeamDetailPage() {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const { role, myTeamIds, myChildren } = useAuth();
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
      <TeamHeaderCard team={team} summary={summary} loading={recordsLoading} nextEvent={nextEvent} />
      {isStaff(role) && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: -8, marginBottom: 12 }}>
          {/* Wave 4.4-B Session 1: deep-link to the briefing portal. The
              old <SendBriefingButton> that lazy-mounted BriefingComposer
              inline is retired in favor of one route + URL params, so
              the portal becomes the single entry point. Team-scoped
              audience auto-fills via the anchor=team param. */}
          <Link to={`/admin/briefings/compose?anchor=team&id=${teamId}`} aria-label="Send briefing about this team"
            className="sf-press"
            style={{ minHeight: 44, padding: '0 14px', borderRadius: 10, fontSize: 13, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer', border: '1.5px solid var(--em-border-default)', backgroundColor: 'var(--em-bg-card)', color: 'var(--em-text-primary)', display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
            <Mail size={14} strokeWidth={1.75} />
            <span>Send briefing</span>
          </Link>
        </div>
      )}
      {myChildPlayer && <MyChildSpotlight player={myChildPlayer} team={team} child={myChild} nextEvent={nextEvent} />}
      {isStaff(role) && <CoachQuickActions teamId={teamId} />}
      <UpcomingEvents teamId={teamId} />

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
      {isStaff(role) && <MessageTeamFAB teamId={teamId} />}
    </div>
  );
}

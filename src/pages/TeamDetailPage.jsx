import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useHomeRole } from '../hooks/useHomeRole';
import { isStaff } from '../lib/permissions';
import { useActiveSeasonTeams } from '../hooks/useActiveSeasonTeams';
import { useRoster } from '../hooks/useRoster';
import { useFilteredRoster } from '../hooks/useFilteredRoster';
import { useAttendanceData } from '../hooks/useAttendanceData';
import { useTeamRecords } from '../hooks/useTeamRecords';
import { useActivities } from '../hooks/useActivities';
import { useRefetchOnVisible } from '../hooks/useRefetchOnVisible';
import { usePlayerSortOrder } from '../hooks/usePlayerSortOrder';
import EmptyState from '../components/shared/EmptyState';
import LoadingSkeleton from '../components/shared/LoadingSkeleton';
import CollapsibleSection from '../components/shared/CollapsibleSection';
import TeamDetailHeroSlot from '../components/roster/TeamDetailHeroSlot';
import TeamDetailOverflowMenu from '../components/roster/TeamDetailOverflowMenu';
import TeamAchievements from '../components/roster/TeamAchievements';
import RosterSection from '../components/roster/RosterSection';
import TeamSwitcher from '../components/roster/TeamSwitcher';
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
  const { teams, loading: teamsLoading } = useActiveSeasonTeams();
  const switcherPrograms = role === 'parent' ? teams.filter((p) => (myTeamIds || []).includes(p.id)) : teams;
  const { players, loading: rosterLoading, refetch: rosterRefetch } = useRoster(teamId);
  useRefetchOnVisible(rosterRefetch);
  // 2026-05-21 (Teams PR C / Q13) — track last roster fetch for the
  // RosterControls "Last updated · tap to refresh" affordance.
  // Microtask wrap matches useTeamHeadCoach / useTeamRecords pattern —
  // defers setState out of the effect body to satisfy
  // react-hooks/set-state-in-effect.
  const [lastFetchedAt, setLastFetchedAt] = useState(() => Date.now());
  useEffect(() => {
    if (rosterLoading) return undefined;
    let cancelled = false;
    Promise.resolve().then(() => { if (!cancelled) setLastFetchedAt(Date.now()); });
    return () => { cancelled = true; };
  }, [rosterLoading]);
  const handleRefresh = useCallback(() => { rosterRefetch(); setLastFetchedAt(Date.now()); }, [rosterRefetch]);
  const { grid } = useAttendanceData(teamId);
  const { summary, loading: recordsLoading } = useTeamRecords(teamId);
  const { activities } = useActivities();
  // 2026-05-21 (Teams audit C7) — useNow lifted INTO TeamDetailHeroSlot so
  // the 60s tick no longer re-renders the full page subtree. Also closes
  // C2 — enrichedPlayers no longer sits under a 60s-ticking parent.
  const [search, setSearch] = useState('');
  // 2026-05-21 (Teams PR C / Q10) — shared sort state so RosterControls
  // chip changes propagate into TeamHeatmap's player ordering. Default
  // 'jersey' matches both surfaces' historical default.
  const { sortOrder, setSortOrder } = usePlayerSortOrder('jersey');
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
  const sortedPlayers = useFilteredRoster(enrichedPlayers, search, sortOrder);
  const team = teams.find((p) => p.id === teamId);
  // 2026-05-21 (Teams PR C / Q14 (c)) — sync document.title for tab/back
  // affordances + assistive tech. Restored on unmount.
  useEffect(() => {
    if (!team?.name) return;
    const prev = document.title;
    document.title = `${team.name} — Aster Sports`;
    return () => { document.title = prev; };
  }, [team?.name]);
  const myChild = role === 'parent' ? (myChildren || []).find((c) => c.teamIds?.includes(teamId) || c.teamId === teamId) : null;
  const myChildPlayer = myChild ? enrichedPlayers.find((p) => p.id === myChild.playerId) : null;

  if (teamsLoading) return <div className="px-4 py-4"><LoadingSkeleton variant="card" count={3} /></div>;
  if (!team) return <div className="px-4 py-4"><EmptyState icon={Users} title="Team not found" description="This team doesn't exist or has been removed." /></div>;

  return (
    <div
      aria-label={`Team detail — ${team?.name || ''}`}
      style={{ padding: 16, minHeight: '100%', background: team?.team_color ? `linear-gradient(180deg, ${team.team_color}08 0%, transparent 200px)` : undefined }}>
      {/* 2026-05-21 (Teams PR C / §9.3) — back chevron strip now carries the
          overflow menu (⋯) on the right. Page-level destructive / staff
          actions live there per §16.14 detail-page contract. */}
      <div className="flex items-center justify-between mb-2">
        <button type="button" onClick={() => navigate('/teams')} className="flex items-center as-press" style={{ minHeight: 44, padding: '0 8px 0 0', background: 'none', border: 'none', color: 'var(--as-accent)', fontSize: 15, fontWeight: 500 }}>
          <ChevronLeft size={20} strokeWidth={1.75} aria-hidden="true" /> Teams
        </button>
        <TeamDetailOverflowMenu team={team} role={role} />
      </div>
      {switcherPrograms.length > 1 && <TeamSwitcher programs={switcherPrograms} teamId={teamId} navigate={navigate} />}
      {/* PR B: hero replaces TeamHeaderCard+MyChildSpotlight+CoachQuickActions
          per §16.14. PR C / V8: "Spring 2026" scope tag below the hero
          surfaces season scope (data IS season-scoped). */}
      <TeamDetailHeroSlot team={team} role={role} summary={recordsLoading ? null : summary} myChild={myChild} myChildPlayer={myChildPlayer} activities={activities} teamId={teamId} />
      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--as-text-tertiary)', padding: '0 4px 8px' }}>
        Spring 2026
      </div>
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
        <RosterSection team={team} sortedPlayers={sortedPlayers} search={search} setSearch={setSearch}
          sortBy={sortOrder} setSortBy={setSortOrder}
          lastFetchedAt={lastFetchedAt} onRefresh={handleRefresh} />
      )}

      {/* PR C / Obs 1 / anti-pattern #51 — TeamPlayerStats mount REMOVED.
          Live-scoring isn't a real Aster Sports feature yet; mount was
          permanent dead space. Second instance after Engine Preview
          retirement (PR #398). */}
      {!rosterLoading && players.length > 0 && (
        <TeamHeatmap teamId={teamId} range={pulseRange}
          onRangeToggle={() => setPulseRange((r) => r === 'season' ? '4weeks' : 'season')}
          sortOrder={sortOrder} />
      )}
      <TeamAchievements teamId={teamId} />
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useActivities } from '../hooks/useActivities';
import { useEventRsvpCounts } from '../hooks/useEventRsvpCounts';
import { useEventRideCounts } from '../hooks/useEventRideCounts';
import { useGameResultsMap } from '../hooks/useGameResultsMap';
import { getWeatherForTime, useWeather } from '../hooks/useWeather';
import { useRefetchOnVisible } from '../hooks/useRefetchOnVisible';
import { useNow } from '../hooks/useNow';
import { useAlertEvaluator } from '../hooks/useAlertEvaluator';
import { useOrgTeamRecords } from '../hooks/useOrgTeamRecords';
import { supabase } from '../lib/supabase';
import AdminGreeting from '../components/admin/AdminGreeting';
import NextEventCard from '../components/admin/NextEventCard';
import SectionShell from '../components/home/SectionShell';
import DateGroupedList from '../components/schedule/DateGroupedList';
import PastEventsSection from '../components/schedule/PastEventsSection';
import DensityToggle from '../components/home/DensityToggle';
import { useDensity } from '../hooks/useDensity';
import ParentHomeTeamCard from '../components/home/ParentHomeTeamCard';
import AlertZone from '../components/alerts/AlertZone';
import ActionZone from '../components/home/ActionZone';
import CoachRosterSnapshot from '../components/coach/CoachRosterSnapshot';
import Label from '../components/shared/Label';
import { filterAlertsForCoach } from '../lib/alerts/relevanceFilters';
import { usePendingAchievements } from '../hooks/usePendingAchievements';
import { useUnpublishedScores } from '../hooks/useUnpublishedScores';
import { useRecentTeamMessages } from '../hooks/useRecentTeamMessages';
import CoachMessageBlock from '../components/home/CoachMessageBlock';

export default function CoachHomePage() {
  const { user, orgId } = useAuth();
  const { activities, loading, error, refetch } = useActivities();
  const { byTeamId: recordsByTeam, loading: recordsLoading } = useOrgTeamRecords(orgId);
  const { counts: rsvpCounts, refetch: refetchRsvpCounts } = useEventRsvpCounts(activities);
  const { counts: rideCounts } = useEventRideCounts(activities);
  const gameResults = useGameResultsMap(activities);
  const weather = useWeather(41.03, -73.76);
  const navigate = useNavigate();
  useRefetchOnVisible(refetch);
  const now = useNow();
  const weekEnd = useMemo(() => now + 7 * 24 * 60 * 60 * 1000, [now]);
  const thisWeek = useMemo(() => activities.filter((a) => {
    if (!a.start_at || a.status === 'cancelled') return false;
    const t = new Date(a.start_at).getTime();
    return t >= now && t <= weekEnd;
  }).sort((a, b) => new Date(a.start_at) - new Date(b.start_at)), [activities, now, weekEnd]);
  const { density } = useDensity('coach-schedule');

  const [myTeams, setMyTeams] = useState([]);
  useEffect(() => {
    if (!user?.id) return;
    Promise.resolve().then(async () => {
      const { data } = await supabase.from('team_staff').select('team_id, teams(id, name, team_color, sort_order)').eq('user_id', user.id);
      const teams = (data || []).filter((r) => r.teams).map((r) => ({ id: r.teams.id, name: r.teams.name, team_color: r.teams.team_color, sort_order: r.teams.sort_order ?? 999 }));
      setMyTeams(teams.sort((a, b) => a.sort_order - b.sort_order));
    });
  }, [user?.id]);

  // Alerts: hook is role-agnostic. Page applies filterAlertsForCoach
  // (data-ownership filter) scoped to coach's team_staff teamIds.
  const coachedTeamIds = useMemo(() => myTeams.map((t) => t.id), [myTeams]);
  const { alerts: allAlerts, loading: alertsLoading } = useAlertEvaluator();
  const coachAlerts = useMemo(() => filterAlertsForCoach(allAlerts, coachedTeamIds), [allAlerts, coachedTeamIds]);

  // ACTION QUEUE per HOME_DESIGN_SPEC §2.1.3. Signals merge into the
  // signal-agnostic ActionZone shell (parent + coach share infra).
  //  - achievement_pending: team_achievements awaiting confirmation
  //  - score_unpublished: game_results entered but not yet published
  // Future signals: roster requests, unapproved coach comp.
  const { items: pendingAchievements, loading: pendingAchievementsLoading } = usePendingAchievements(coachedTeamIds);
  const { items: unpublishedScores, loading: unpublishedScoresLoading } = useUnpublishedScores(coachedTeamIds);
  const actionQueueItems = useMemo(
    () => [...(pendingAchievements || []), ...(unpublishedScores || [])],
    [pendingAchievements, unpublishedScores],
  );
  const actionQueueLoading = pendingAchievementsLoading || unpublishedScoresLoading;

  // MESSAGING BLOCK per HOME_DESIGN_SPEC §2.1.4. Latest team-chat
  // message per coached team (24h window), excluding the coach's own
  // posts. Reuses the same CoachMessageBlock component that parent
  // home uses (PR #287) — component is role-agnostic; data source
  // differs by hook.
  const { messages: recentTeamMessages } = useRecentTeamMessages(coachedTeamIds, user?.id, now);

  // Next event across all coached teams. Pulse-glow wrapper draws
  // the eye to the upcoming game per Q4 highlight #1.
  const nextEvent = thisWeek[0];

  return (
    <div className="px-4 py-5 flex flex-col gap-6 sf-fade-in">
      <AdminGreeting user={user} />

      <AlertZone alerts={coachAlerts} loading={alertsLoading} variant="collapsible" sectionLabel="ALERTS" />
      <ActionZone items={actionQueueItems} loading={actionQueueLoading} />
      <CoachMessageBlock messages={recentTeamMessages} nowMs={now} />

      {nextEvent && (
        <div style={{
          borderRadius: 12, padding: 2,
          border: '1.5px solid var(--em-accent)',
          boxShadow: 'var(--em-shadow-md)',
        }}>
          <NextEventCard event={nextEvent} weather={getWeatherForTime(weather, nextEvent.start_at)} />
        </div>
      )}

      <SectionShell
        title="NEXT 7 DAYS"
        titleAction={<DensityToggle sectionKey="coach-schedule" />}
        sectionKey="coach-now"
        loading={loading}
        error={error}
        skeletonVariant="card"
        skeletonRows={2}
        empty={thisWeek.length === 0 ? { heading: 'All caught up', message: 'No events in the next 7 days.' } : null}
      >
        {thisWeek.length > 0 && <DateGroupedList events={thisWeek} density={density} rsvpCounts={rsvpCounts} rideCounts={rideCounts} gameResults={gameResults} weather={weather} onRsvpChange={refetchRsvpCounts} />}
      </SectionShell>

      <PastEventsSection activities={activities} rsvpCounts={rsvpCounts} rideCounts={rideCounts} gameResults={gameResults} weather={weather} onRsvpChange={refetchRsvpCounts} />

      {myTeams.length > 0 && (
        <section className="min-w-0" aria-label="Roster snapshot">
          <Label>ROSTER SNAPSHOT</Label>
          <CoachRosterSnapshot teams={myTeams} />
        </section>
      )}

      <SectionShell
        title="MY TEAMS"
        sectionKey="coach-my-teams"
        loading={loading && myTeams.length === 0}
        skeletonVariant="row"
        empty={myTeams.length === 0 ? { heading: 'No teams yet', message: 'Once an admin assigns you to a team, it appears here.' } : null}
      >
        <div className="flex gap-2 flex-wrap" style={{ paddingBottom: 4 }}>
          {myTeams.map((t) => (
            <ParentHomeTeamCard
              key={t.id}
              team={t}
              summary={recordsByTeam[t.id]}
              loading={recordsLoading}
              onClick={() => navigate(`/schedule?team=${t.id}`)}
            />
          ))}
        </div>
      </SectionShell>

    </div>
  );
}

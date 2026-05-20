import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useActivities } from '../hooks/useActivities';
import { useEventRsvpCounts } from '../hooks/useEventRsvpCounts';
import { useEventRideCounts } from '../hooks/useEventRideCounts';
import { useGameResultsMap } from '../hooks/useGameResultsMap';
import { getWeatherForTime, useWeather } from '../hooks/useWeather';
import { useRefetchOnVisible } from '../hooks/useRefetchOnVisible';
import { useNow } from '../hooks/useNow';
import { useOrgTeamRecords } from '../hooks/useOrgTeamRecords';
import { useCoachHomeSignals } from '../hooks/useCoachHomeSignals';
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
import LoadingSkeleton from '../components/shared/LoadingSkeleton';
import CoachMessageBlock from '../components/home/CoachMessageBlock';
import CoachHomeQuickActions from '../components/home/CoachHomeQuickActions';
import UpcomingPrepCard from '../components/home/UpcomingPrepCard';
import RidesTodayCard from '../components/admin/RidesTodayCard';
import { useUpcomingPrep } from '../hooks/useUpcomingPrep';
import { useRidesTodaySummary } from '../hooks/useRidesTodaySummary';

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
  const upcomingPrep = useUpcomingPrep(thisWeek, now);

  // Coach-home queue + signal aggregation lives in
  // useCoachHomeSignals — extracted in PR #310 to keep this page
  // under the 150-line cap (anti-pattern #11). Mirrors the
  // useParentHomeSignals (PR #304) + useAdminHomeSignals (PR #297)
  // patterns.
  const {
    myTeams,
    coachAlerts, alertsLoading,
    actionQueueItems, actionQueueLoading,
    recentTeamMessages,
  } = useCoachHomeSignals(user?.id, now);
  const coachedTeamIds = useMemo(() => myTeams.map((t) => t.id), [myTeams]);
  const coachRidesSummary = useRidesTodaySummary(orgId, now, coachedTeamIds);

  // Next event across all coached teams. Pulse-glow wrapper draws
  // the eye to the upcoming game per Q4 highlight #1.
  const nextEvent = thisWeek[0];

  // Top-level loading gate mirrors ParentHomePage:84 (PR #339). Without
  // this, coach home rendered its shell immediately and cards populated
  // independently as each fetch resolved — visible to Frank-on-mobile
  // as "old screens load first." Asymmetric vs parent home, which had
  // the gate since Sprint B. Symmetry restored.
  if (loading) return <div style={{ padding: 24 }} role="status" aria-live="polite"><LoadingSkeleton variant="card" count={2} /></div>;

  return (
    <div className="px-4 py-5 flex flex-col gap-6 sf-fade-in">
      <AdminGreeting user={user} />

      <AlertZone alerts={coachAlerts} loading={alertsLoading} variant="collapsible" sectionLabel="ALERTS" />
      <ActionZone items={actionQueueItems} loading={actionQueueLoading} sectionKey="coach-action-zone" />
      <RidesTodayCard summary={coachRidesSummary} loading={coachRidesSummary.loading} />
      <UpcomingPrepCard prep={upcomingPrep} />
      <CoachHomeQuickActions />
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

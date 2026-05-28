import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useActivities } from '../hooks/useActivities';
import { useEventRsvpCounts } from '../hooks/useEventRsvpCounts';
import { useEventRideCounts } from '../hooks/useEventRideCounts';
import { useGameResultsMap } from '../hooks/useGameResultsMap';
import { useWeather } from '../hooks/useWeather';
import { useRefetchOnVisible } from '../hooks/useRefetchOnVisible';
import { useNow } from '../hooks/useNow';
import { useOrgTeamRecords } from '../hooks/useOrgTeamRecords';
import { useCoachHomeSignals } from '../hooks/useCoachHomeSignals';
import { useHomeRole } from '../hooks/useHomeRole';
import { useDensity } from '../hooks/useDensity';
import { useUpcomingPrep } from '../hooks/useUpcomingPrep';
import { useRidesTodaySummary } from '../hooks/useRidesTodaySummary';
import CoachHomeHeader from '../components/coach-home/CoachHomeHeader';
import CoachHomeAlertZone from '../components/coach-home/CoachHomeAlertZone';
import CoachHomeSignalZone from '../components/coach-home/CoachHomeSignalZone';
import LoadingSkeleton from '../components/shared/LoadingSkeleton';

// Orchestration only — header / alert-zone / signal-zone surfaces
// live in src/components/coach-home/. Signal hook lives in
// useCoachHomeSignals (PR #310). Page split into sub-components in
// the preemptive split arc per L99 platform audit PART 5 Phase 4 /
// PQ3 (2026-05-21).
export default function CoachHomePage() {
  const { user, orgId } = useAuth();
  const { isViewingAs } = useHomeRole();
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
  const signals = useCoachHomeSignals(user?.id, now);
  const { myTeams, alertsLoading, actionQueueLoading } = signals;
  const coachedTeamIds = useMemo(() => myTeams.map((t) => t.id), [myTeams]);
  const coachRidesSummary = useRidesTodaySummary(orgId, now, coachedTeamIds);
  const nextEvent = thisWeek[0];

  // Multi-signal loading gate — anti-pattern #43 invariant (cascade
  // flash fix, 2026-05-20). Audit test in homePageLoadingGateAudit.
  const isLoading = loading || alertsLoading || actionQueueLoading;
  if (isLoading) return <div style={{ padding: 24 }} role="status" aria-live="polite"><LoadingSkeleton variant="card" count={2} /></div>;

  return (
    <div className="px-4 py-5 flex flex-col gap-6 em-fade-in">
      <CoachHomeHeader user={user} />
      <CoachHomeAlertZone
        alerts={signals.coachAlerts} alertsLoading={alertsLoading}
        actionItems={signals.actionQueueItems} actionItemsLoading={actionQueueLoading}
      />
      <CoachHomeSignalZone
        signals={signals} loading={loading} error={error}
        thisWeek={thisWeek} nextEvent={nextEvent} activities={activities}
        weather={weather} rsvpCounts={rsvpCounts} rideCounts={rideCounts}
        gameResults={gameResults} refetchRsvpCounts={refetchRsvpCounts}
        density={density} upcomingPrep={upcomingPrep}
        coachRidesSummary={coachRidesSummary}
        recordsByTeam={recordsByTeam} recordsLoading={recordsLoading}
        isViewingAs={isViewingAs} nowMs={now}
        onTeamClick={(teamId) => navigate(`/schedule?team=${teamId}`)}
      />
    </div>
  );
}

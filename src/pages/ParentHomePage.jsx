import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSeason } from '../context/SeasonContext';
import { useActivities } from '../hooks/useActivities';
import { usePrefetchChildRsvps } from '../hooks/usePrefetchChildRsvps';
import { useRefetchOnVisible } from '../hooks/useRefetchOnVisible';
import { useNow } from '../hooks/useNow';
import { useEventRsvpCounts } from '../hooks/useEventRsvpCounts';
import { useEventRideCounts } from '../hooks/useEventRideCounts';
import { useEventDutyCounts } from '../hooks/useEventDutyCounts';
import { useGameResultsMap } from '../hooks/useGameResultsMap';
import { useWeather } from '../hooks/useWeather';
import { useOrgTeamRecords } from '../hooks/useOrgTeamRecords';
import { useDensity } from '../hooks/useDensity';
import { useAlertEvaluator } from '../hooks/useAlertEvaluator';
import { useParentHomeSignals } from '../hooks/useParentHomeSignals';
import ParentHomeHeader from '../components/parent-home/ParentHomeHeader';
import ParentHomeAlertZone from '../components/parent-home/ParentHomeAlertZone';
import ParentHomeSignalZone from '../components/parent-home/ParentHomeSignalZone';
import LoadingSkeleton from '../components/shared/LoadingSkeleton';
import { firstNameFrom } from '../lib/greetings';
import { filterAlertsForParent } from '../lib/alerts/relevanceFilters';

// Orchestration only — header / alert-zone / signal-zone surfaces live
// in src/components/parent-home/. Signal hook lives in useParentHomeSignals
// (PR #304). Page split into sub-components in the preemptive split arc
// per L99 platform audit PART 5 Phase 4 / PQ3 (2026-05-21).
export default function ParentHomePage() {
  const { user, guardianFirstName, guardianId, myChildren, myTeamIds, orgId, orgName } = useAuth();
  const { activeSeason } = useSeason();
  const { activities, loading, refetch } = useActivities();
  const { byTeamId: recordsByTeam, loading: recordsLoading } = useOrgTeamRecords(orgId);
  const navigate = useNavigate();
  const [activeKidFilter, setActiveKidFilter] = useState(null);
  const name = guardianFirstName ? guardianFirstName.charAt(0).toUpperCase() + guardianFirstName.slice(1) : firstNameFrom(user);
  usePrefetchChildRsvps(activities, myChildren);
  const now = useNow();
  useRefetchOnVisible(refetch);
  const { density } = useDensity('parent-home');
  const signals = useParentHomeSignals({
    activities, myChildren, myTeamIds, now, activeKidFilter,
    userId: user?.id, orgId, activeSeasonId: activeSeason?.id, guardianId,
  });
  const { filteredNext7, actionItemsLoading, financialsLoading } = signals;
  const { counts: rsvpCounts, refetch: refetchRsvpCounts } = useEventRsvpCounts(filteredNext7);
  const { counts: rideCounts } = useEventRideCounts(filteredNext7);
  const { counts: dutyCounts } = useEventDutyCounts(filteredNext7);
  const gameResults = useGameResultsMap(filteredNext7);
  const weather = useWeather(41.03, -73.76);
  const { alerts: allAlerts, loading: alertsLoading } = useAlertEvaluator();
  const parentAlerts = useMemo(() => filterAlertsForParent(allAlerts, myChildren), [allAlerts, myChildren]);

  // Multi-signal loading gate — anti-pattern #43 invariant (cascade
  // flash fix, 2026-05-20). Audit test in homePageLoadingGateAudit.
  // Wave 2.B Batch 1 (#1 P0-2): alertsLoading dropped from the gate —
  // AlertZone renders its own shape-matched skeleton (always_visible)
  // or null (collapsible) when loading, so blocking the whole page on
  // it costs LCP without preventing layout flash.
  const isLoading = loading || actionItemsLoading || financialsLoading;
  if (isLoading) return <div style={{ padding: 24 }} role="status" aria-live="polite"><LoadingSkeleton variant="card" count={2} /></div>;

  return (
    <div className="px-4 py-5 flex flex-col gap-6 em-fade-in">
      <ParentHomeHeader name={name} orgName={orgName} myTeamsCount={signals.myTeams.length} />
      <ParentHomeAlertZone
        alerts={parentAlerts} alertsLoading={alertsLoading}
        conflicts={signals.conflicts}
        actionItems={signals.actionItems} actionItemsLoading={actionItemsLoading}
      />
      <ParentHomeSignalZone
        signals={signals} loading={loading} orgName={orgName}
        recordsByTeam={recordsByTeam} recordsLoading={recordsLoading}
        activities={activities} weather={weather}
        rsvpCounts={rsvpCounts} rideCounts={rideCounts} dutyCounts={dutyCounts}
        gameResults={gameResults} refetchRsvpCounts={refetchRsvpCounts}
        density={density} myChildren={myChildren}
        activeKidFilter={activeKidFilter} onKidFilterChange={setActiveKidFilter}
        activeSeasonName={activeSeason?.name} nowMs={now} onNavigate={navigate}
      />
    </div>
  );
}

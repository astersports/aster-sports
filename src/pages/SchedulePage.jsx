import { lazy, Suspense, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useActivities } from '../hooks/useActivities';
import { useEventRsvpCounts } from '../hooks/useEventRsvpCounts';
import { useEventRideCounts } from '../hooks/useEventRideCounts';
import { useEventDutyCounts } from '../hooks/useEventDutyCounts';
import { useRefetchOnVisible } from '../hooks/useRefetchOnVisible';
import FilterBar from '../components/schedule/FilterBar';
import DateGroupedList from '../components/schedule/DateGroupedList';
import ChildFilterChips from '../components/schedule/ChildFilterChips';
import ScheduleFab from '../components/schedule/ScheduleFab';
import ViewToggle from '../components/schedule/ViewToggle';
import GamesView from '../components/schedule/GamesView';
import TextEmptyState from '../components/shared/TextEmptyState';
import Label from '../components/shared/Label';
import LoadingSkeleton from '../components/shared/LoadingSkeleton';
import DensityToggle from '../components/home/DensityToggle';
import { useDensity } from '../hooks/useDensity';
import { useGameResultsMap } from '../hooks/useGameResultsMap';
import { useWeather } from '../hooks/useWeather';
import { useNow } from '../hooks/useNow';
import { isStaff } from '../lib/permissions';
import ShareScheduleButton from '../components/schedule/ShareScheduleButton';
const CreateActivityWizard = lazy(() => import('../components/wizard/CreateActivityWizard'));

export default function SchedulePage() {
  const { orgId, myChildren, role } = useAuth();
  const { activities, loading, refetch } = useActivities();
  const rsvpCounts = useEventRsvpCounts(activities);
  const rideCounts = useEventRideCounts(activities);
  const dutyCounts = useEventDutyCounts(activities);
  const [selectedTeam, setSelectedTeam] = useState(() => new URLSearchParams(window.location.search).get('team'));
  const [selectedType, setSelectedType] = useState(null);
  const [activeKidFilter, setActiveKidFilter] = useState(null);
  const [showWizard, setShowWizard] = useState(() => new URLSearchParams(window.location.search).get('wizard') === '1');
  const [showCancelled, setShowCancelled] = useState(false);
  const [viewMode, setViewMode] = useState('all');
  const { density } = useDensity('schedule-list', 'medium');
  const gameResults = useGameResultsMap(activities);
  const weather = useWeather(41.03, -73.76);

  const nowMs = useNow();
  useRefetchOnVisible(refetch);
  const weekEnd = useMemo(() => new Date(nowMs + 7 * 24 * 60 * 60 * 1000), [nowMs]);

  const filtered = useMemo(() => {
    let list = activities;
    const kid = activeKidFilter && (myChildren || []).find((k) => k.playerId === activeKidFilter);
    const kidTeamIds = kid?.teamIds?.length ? kid.teamIds : (kid?.teamId ? [kid.teamId] : []);
    if (kidTeamIds.length) list = list.filter((a) => kidTeamIds.includes(a.team_id));
    if (selectedTeam) list = list.filter((a) => a.team_id === selectedTeam);
    if (selectedType) {
      if (selectedType === 'game') {
        list = list.filter((a) => a.event_type === 'game' || a.event_type === 'tournament');
      } else {
        list = list.filter((a) => a.event_type === selectedType);
      }
    }
    if (!showCancelled) list = list.filter((a) => a.status !== 'cancelled');
    return list.sort((a, b) => new Date(a.start_at) - new Date(b.start_at));
  }, [activities, selectedTeam, selectedType, showCancelled, activeKidFilter, myChildren]);

  const lookbackMs = isStaff(role) ? 48 * 60 * 60 * 1000 : 0;
  const upcoming = useMemo(() => {
    const cutoff = new Date(nowMs - lookbackMs);
    return filtered.filter((a) => new Date(a.start_at) >= cutoff && new Date(a.start_at) <= weekEnd);
  }, [filtered, nowMs, lookbackMs, weekEnd]);
  const nextEventId = upcoming.find((a) => new Date(a.start_at).getTime() >= nowMs)?.id || null;
  const remaining = useMemo(() => filtered.filter((a) => new Date(a.start_at) > weekEnd), [filtered, nowMs, weekEnd]);

  if (loading) return <div style={{ padding: 24 }} role="status" aria-live="polite"><LoadingSkeleton variant="card" count={2} /></div>;

  return (
    <>
      <div className="px-4 py-4">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <h1 className="font-bold" style={{ color: 'var(--em-text-primary)', fontSize: 20 }}>Schedule</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ViewToggle value={viewMode} onChange={setViewMode} />
            {isStaff(role) && selectedTeam && <ShareScheduleButton teamId={selectedTeam} teamName="" />}
          </div>
        </div>
        <div style={{ width: 32, height: 3, backgroundColor: 'var(--em-accent)', borderRadius: 2, marginBottom: 8 }} />

        {viewMode === 'games' ? (
          <GamesView activities={activities} orgId={orgId} />
        ) : (
          <>
            <ChildFilterChips kids={myChildren} activeFilter={activeKidFilter} onChange={setActiveKidFilter} />
            <FilterBar teams={activities} selectedTeam={selectedTeam} onSelectTeam={setSelectedTeam} selectedType={selectedType} onSelectType={setSelectedType} showCancelled={showCancelled} onToggleCancelled={() => setShowCancelled((v) => !v)} hideTeamRow={myChildren?.length >= 2} />
            {upcoming.length === 0 ? (
              <TextEmptyState heading="No events this week" message="Check back later or tap + to create one." />
            ) : (
              <div style={{ marginTop: 8 }}>
                <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
                  <Label style={{ marginBottom: 0 }}>Next 7 days</Label>
                  <DensityToggle sectionKey="schedule-list" />
                </div>
                <DateGroupedList events={upcoming} rsvpCounts={rsvpCounts} rideCounts={rideCounts} dutyCounts={dutyCounts} nextEventId={nextEventId} density={density} gameResults={gameResults} weather={weather} />
              </div>
            )}
            {remaining.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <Label>Later</Label>
                <DateGroupedList events={remaining} rsvpCounts={rsvpCounts} rideCounts={rideCounts} dutyCounts={dutyCounts} density={density} gameResults={gameResults} weather={weather} />
              </div>
            )}
          </>
        )}
      </div>

      {isStaff(role) && <ScheduleFab onClick={() => setShowWizard(true)} />}

      {showWizard && (
        <Suspense fallback={null}>
          <CreateActivityWizard
            orgId={orgId}
            onClose={() => setShowWizard(false)}
            onCreated={refetch}
          />
        </Suspense>
      )}
    </>
  );
}

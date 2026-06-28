import { lazy, Suspense, useCallback, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useScheduleData } from '../hooks/useScheduleData';
import { useRefetchOnVisible } from '../hooks/useRefetchOnVisible';
import FilterBar from '../components/schedule/FilterBar';
import ChildFilterChips from '../components/schedule/ChildFilterChips';
import WeekStrip from '../components/schedule/WeekStrip';
import ScheduleFab from '../components/schedule/ScheduleFab';
import ViewToggle from '../components/schedule/ViewToggle';
import GamesView from '../components/schedule/GamesView';
import LoadingSkeleton from '../components/shared/LoadingSkeleton';
import ScheduleListSections from '../components/schedule/ScheduleListSections';
import ScheduleErrorState from '../components/schedule/ScheduleErrorState';
import ActiveFilterSummary from '../components/schedule/ActiveFilterSummary';
import JumpToTodayBar from '../components/schedule/JumpToTodayBar';
import FilteredEmptyState from '../components/schedule/FilteredEmptyState';
import { useScheduleFilters } from '../components/schedule/useScheduleFilters';
import { useDensity } from '../hooks/useDensity';
import { usePreferences } from '../hooks/usePreferences';
import { useWeatherContext } from '../context/WeatherContext';
import { isStaff } from '../lib/permissions';
import ShareScheduleButton from '../components/shared/ShareScheduleButton';
const CreateActivityWizard = lazy(() => import('../components/wizard/CreateActivityWizard'));

export default function SchedulePage() {
  const { orgId, myChildren, role } = useAuth();
  const scheduleData = useScheduleData();
  const { activities, loading, error, refetch } = scheduleData;
  const [showWizard, setShowWizard] = useState(() => new URLSearchParams(window.location.search).get('wizard') === '1');
  const f = useScheduleFilters(activities, myChildren);
  // SD-7: viewMode persists per user; transient filters stay session-local (in the hook).
  const { preferences, updatePreference } = usePreferences();
  const [viewModeLocal, setViewModeLocal] = useState(null);
  const viewMode = viewModeLocal ?? preferences?.schedule_view ?? 'all';
  const setViewMode = (v) => { setViewModeLocal(v); updatePreference('schedule_view', v).catch(() => {}); };
  // SD-1: the home-level card_density default (§16.2) is the ONE density control.
  const { density } = useDensity('default');
  const { weather } = useWeatherContext();
  const data = useMemo(() => ({ ...scheduleData, weather }), [scheduleData, weather]);

  useRefetchOnVisible(refetch);

  const handleDaySelect = useCallback((dateStr) => {
    f.setSelectedDate(dateStr);
    if (dateStr) {
      setTimeout(() => {
        const el = document.querySelector(`[data-date-group="${dateStr}"]`);
        if (!el) return;
        const main = document.querySelector('main');
        if (main) main.scrollTo({ top: el.offsetTop - 120, behavior: 'smooth' });
      }, 50);
    }
  }, [f]);

  if (loading) return <div style={{ padding: 24 }} role="status" aria-live="polite"><LoadingSkeleton variant="card" count={2} /></div>;

  const filteredEmpty = f.hasActiveFilters && f.filtered.length === 0;

  return (
    <>
      <div className="px-4 py-4">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 4 }}>
          <h1 className="font-bold" style={{ color: 'var(--as-text-primary)', fontSize: 20 }}>Schedule</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ViewToggle value={viewMode} onChange={setViewMode} />
            {isStaff(role) && f.selectedTeam && <ShareScheduleButton teamId={f.selectedTeam} style={{ minHeight: 44, padding: '0 12px', borderRadius: 999, border: '1px solid var(--as-border-default)', backgroundColor: 'var(--as-bg-card)', color: 'var(--as-accent)', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }} />}
          </div>
        </div>
        <div style={{ width: 32, height: 3, backgroundColor: 'var(--as-accent)', borderRadius: 2, marginBottom: 8 }} />

        {error ? (
          <ScheduleErrorState onRetry={refetch} />
        ) : viewMode === 'games' ? (
          <GamesView activities={activities} orgId={orgId} data={data} density={density} />
        ) : (
          <>
            {/* SD-5/SD-8: strip hidden in Games mode — dead there. */}
            <WeekStrip eventDates={f.eventDates} selectedDate={f.selectedDate} onSelect={handleDaySelect} />
            <JumpToTodayBar selectedDate={f.selectedDate} onJump={() => handleDaySelect(null)} />
            <ChildFilterChips kids={myChildren} activeFilter={f.activeKidFilter} onChange={f.setActiveKidFilter} />
            <FilterBar teams={activities} selectedTeam={f.selectedTeam} onSelectTeam={f.selectTeam} selectedType={f.selectedType} onSelectType={f.setSelectedType} showCancelled={f.showCancelled} onToggleCancelled={f.toggleCancelled} hideTeamRow={myChildren?.length >= 2} />
            <ActiveFilterSummary
              resultCount={f.filtered.length}
              teamName={f.teamName} onClearTeam={() => f.selectTeam(null)}
              kidName={f.kidName} onClearKid={() => f.setActiveKidFilter(null)}
              selectedType={f.selectedType} onClearType={() => f.setSelectedType(null)}
              showCancelled={f.showCancelled} onClearCancelled={f.toggleCancelled}
              onClearAll={f.clearAll}
            />
            {filteredEmpty ? (
              <FilteredEmptyState onClearAll={f.clearAll} />
            ) : (
              <ScheduleListSections filtered={f.filtered} data={data} density={density} role={role} />
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

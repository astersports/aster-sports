import { lazy, Suspense, useMemo, useState } from 'react';
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
import { useDensity } from '../hooks/useDensity';
import { usePreferences } from '../hooks/usePreferences';
import { useWeather } from '../hooks/useWeather';
import { WEATHER_DEFAULT_COORDS } from '../lib/constants';
import { isStaff } from '../lib/permissions';
import ShareScheduleButton from '../components/shared/ShareScheduleButton';
const CreateActivityWizard = lazy(() => import('../components/wizard/CreateActivityWizard'));

export default function SchedulePage() {
  const { orgId, myChildren, role } = useAuth();
  const scheduleData = useScheduleData();
  const { activities, loading, refetch } = scheduleData;
  const [selectedTeam, setSelectedTeam] = useState(() => new URLSearchParams(window.location.search).get('team'));
  const [selectedType, setSelectedType] = useState(null);
  const [activeKidFilter, setActiveKidFilter] = useState(null);
  const [showWizard, setShowWizard] = useState(() => new URLSearchParams(window.location.search).get('wizard') === '1');
  const [showCancelled, setShowCancelled] = useState(false);
  // SD-7 (a-minimal, PR-F'): viewMode persists per user; team reflects
  // to the URL. Transient filters (kid/type/cancelled) stay session-local.
  const { preferences, updatePreference } = usePreferences();
  const [viewModeLocal, setViewModeLocal] = useState(null);
  const viewMode = viewModeLocal ?? preferences?.schedule_view ?? 'all';
  const setViewMode = (v) => { setViewModeLocal(v); updatePreference('schedule_view', v).catch(() => {}); };
  const selectTeam = (t) => {
    setSelectedTeam(t);
    const u = new URL(window.location);
    if (t) u.searchParams.set('team', t); else u.searchParams.delete('team');
    window.history.replaceState({}, '', u);
  };
  const [selectedDate, setSelectedDate] = useState(null);
  // SD-1: the dead 'schedule-list' density key is purged — the home-level
  // card_density default (§16.2) is the ONE density control.
  const { density } = useDensity('default');
  const weather = useWeather(...WEATHER_DEFAULT_COORDS);
  const data = useMemo(() => ({ ...scheduleData, weather }), [scheduleData, weather]);

  useRefetchOnVisible(refetch);

  // (SD-8 PR-F'): dots reflect the FILTERED set — a dot for an event the
  // active kid/team/type filter hides was a lie. Memo moved below
  // `filtered` accordingly.

  const handleDaySelect = (dateStr) => {
    setSelectedDate(dateStr);
    if (dateStr) {
      setTimeout(() => {
        const el = document.querySelector(`[data-date-group="${dateStr}"]`);
        if (!el) return;
        const main = document.querySelector('main');
        if (main) { main.scrollTo({ top: el.offsetTop - 120, behavior: 'smooth' }); }
      }, 50);
    }
  };

  const filtered = useMemo(() => {
    let list = activities;
    const kid = activeKidFilter && (myChildren || []).find((k) => k.playerId === activeKidFilter);
    const kidTeamIds = kid?.teamIds?.length ? kid.teamIds : (kid?.teamId ? [kid.teamId] : []);
    if (kidTeamIds.length) list = list.filter((a) => kidTeamIds.includes(a.team_id));
    if (selectedTeam) list = list.filter((a) => a.team_id === selectedTeam);
    if (selectedType) {
      list = list.filter((a) => a.event_type === selectedType);
    }
    if (!showCancelled) list = list.filter((a) => a.status !== 'cancelled');
    return list.sort((a, b) => new Date(a.start_at) - new Date(b.start_at));
  }, [activities, selectedTeam, selectedType, showCancelled, activeKidFilter, myChildren]);

  const eventDates = useMemo(() => {
    return filtered.map((a) => a.start_at ? new Date(a.start_at).toLocaleDateString('en-CA', { timeZone: 'America/New_York' }) : null).filter(Boolean);
  }, [filtered]);

  if (loading) return <div style={{ padding: 24 }} role="status" aria-live="polite"><LoadingSkeleton variant="card" count={2} /></div>;

  return (
    <>
      <div className="px-4 py-4">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <h1 className="font-bold" style={{ color: 'var(--as-text-primary)', fontSize: 20 }}>Schedule</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ViewToggle value={viewMode} onChange={setViewMode} />
            {isStaff(role) && selectedTeam && <ShareScheduleButton teamId={selectedTeam} style={{ minHeight: 44, padding: '0 12px', borderRadius: 999, border: '1px solid var(--as-border-default)', backgroundColor: 'var(--as-bg-card)', color: 'var(--as-accent)', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }} />}
          </div>
        </div>
        <div style={{ width: 32, height: 3, backgroundColor: 'var(--as-accent)', borderRadius: 2, marginBottom: 8 }} />

        {viewMode === 'games' ? (
          <GamesView activities={activities} orgId={orgId} data={data} density={density} />
        ) : (
          <>
            {/* SD-5/SD-8 (VF-12b): strip hidden in Games mode — it was
                mounted but dead there (day-taps scrolled a list that
                wasn't rendered). */}
            <WeekStrip eventDates={eventDates} selectedDate={selectedDate} onSelect={handleDaySelect} />
            <ChildFilterChips kids={myChildren} activeFilter={activeKidFilter} onChange={setActiveKidFilter} />
            <FilterBar teams={activities} selectedTeam={selectedTeam} onSelectTeam={selectTeam} selectedType={selectedType} onSelectType={setSelectedType} showCancelled={showCancelled} onToggleCancelled={() => setShowCancelled((v) => !v)} hideTeamRow={myChildren?.length >= 2} />
            <ScheduleListSections filtered={filtered} data={data} density={density} role={role} />
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

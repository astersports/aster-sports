import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useActivities } from '../hooks/useActivities';
import { useEventRsvpCounts } from '../hooks/useEventRsvpCounts';
import { useEventRideCounts } from '../hooks/useEventRideCounts';
import { useEventDutyCounts } from '../hooks/useEventDutyCounts';
import { Plus, ChevronDown } from 'lucide-react';
import FilterBar from '../components/schedule/FilterBar';
import NextUpCard from '../components/schedule/NextUpCard';
import DateGroupedList from '../components/schedule/DateGroupedList';
import CreateActivityWizard from '../components/wizard/CreateActivityWizard';

export default function SchedulePage() {
  const { orgId } = useAuth();
  const { activities, loading, refetch } = useActivities(orgId);
  const rsvpCounts = useEventRsvpCounts(activities);
  const rideCounts = useEventRideCounts(activities);
  const dutyCounts = useEventDutyCounts(activities);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [showCancelled, setShowCancelled] = useState(false);

  // tick increments every 60s so the upcoming / thisWeek / remaining
  // memos re-evaluate against a fresh `now`. Without this, a user who
  // leaves the schedule open would see nextEvent stuck on an event
  // that has already ended.
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(id);
  }, []);

  const now = useMemo(() => new Date(), [tick]);
  const weekEnd = useMemo(() => new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), [now]);

  const filtered = useMemo(() => {
    let list = activities;
    if (selectedTeam) list = list.filter((a) => a.team_id === selectedTeam);
    if (selectedType) list = list.filter((a) => a.event_type === selectedType);
    if (!showCancelled) list = list.filter((a) => a.status !== 'cancelled');
    return list.sort((a, b) => new Date(a.start_at) - new Date(b.start_at));
  }, [activities, selectedTeam, selectedType, showCancelled]);

  const upcoming = useMemo(() => filtered.filter((a) => new Date(a.start_at) >= now), [filtered, tick, now]);
  const nextEvent = upcoming[0] || null;
  const thisWeek = useMemo(() => upcoming.filter((a) => new Date(a.start_at) <= weekEnd), [upcoming, tick, weekEnd]);
  const remaining = useMemo(() => upcoming.filter((a) => new Date(a.start_at) > weekEnd), [upcoming, tick, weekEnd]);

  if (loading) return <div style={{ padding: 24, color: 'var(--sf-text-tertiary)' }}>Loading...</div>;

  return (
    <>
      <div className="px-4 py-4">
        <h1 className="font-bold" style={{ color: 'var(--sf-text-primary)', fontSize: 20, marginBottom: 4 }}>
          Schedule
        </h1>
        <div style={{ width: 32, height: 3, backgroundColor: 'var(--sf-accent)', borderRadius: 2, marginBottom: 16 }} />

        {nextEvent && <NextUpCard event={nextEvent} rsvpCount={rsvpCounts[nextEvent.id]} rideCount={rideCounts[nextEvent.id]} dutyCount={dutyCounts[nextEvent.id]} onRefresh={refetch} />}

        <FilterBar
          teams={activities}
          selectedTeam={selectedTeam}
          onSelectTeam={setSelectedTeam}
          selectedType={selectedType}
          onSelectType={setSelectedType}
          showCancelled={showCancelled}
          onToggleCancelled={() => setShowCancelled((v) => !v)}
        />

        {thisWeek.length > 0 ? (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--sf-text-tertiary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              This week
            </div>
            <DateGroupedList events={thisWeek} rsvpCounts={rsvpCounts} rideCounts={rideCounts} dutyCounts={dutyCounts} />
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--sf-text-tertiary)' }}>
            <div style={{ fontSize: 15, fontWeight: 500 }}>No events this week</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>Tap + to create one</div>
          </div>
        )}

        {remaining.length > 0 && !showAll && (
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className="sf-press"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
              width: '100%', minHeight: 44, marginTop: 16, borderRadius: 10,
              border: '1px solid var(--sf-border-default)', backgroundColor: 'var(--sf-bg-card)',
              color: 'var(--sf-text-secondary)', fontSize: 14, fontWeight: 500,
            }}
          >
            See full schedule ({remaining.length} more)
            <ChevronDown size={16} strokeWidth={1.75} />
          </button>
        )}

        {showAll && remaining.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--sf-text-tertiary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Upcoming
            </div>
            <DateGroupedList events={remaining} rsvpCounts={rsvpCounts} rideCounts={rideCounts} dutyCounts={dutyCounts} />
          </div>
        )}
      </div>

      {/* FAB — outside content div, no transform ancestor */}
      <button
        type="button"
        onClick={() => setShowWizard(true)}
        className="sf-press sf-bounce-tap"
        aria-label="Create event"
        style={{
          position: 'fixed',
          bottom: 'calc(80px + env(safe-area-inset-bottom, 0px) + 8px)',
          right: 16, width: 56, height: 56, borderRadius: 28,
          backgroundColor: 'var(--sf-accent)', color: 'var(--sf-text-inverse)',
          border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 100,
        }}
      >
        <Plus size={24} strokeWidth={2} />
      </button>

      {showWizard && (
        <CreateActivityWizard
          orgId={orgId}
          onClose={() => setShowWizard(false)}
          onCreated={refetch}
        />
      )}
    </>
  );
}

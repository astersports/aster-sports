import { useState, useMemo } from 'react';
import { Calendar, Plus } from 'lucide-react';
import { useActivities } from '../hooks/useActivities';
import { usePrograms } from '../hooks/usePrograms';
import { useEventRsvpCounts } from '../hooks/useEventRsvpCounts';
import { useScheduleScroll } from '../hooks/useScheduleScroll';
import { useAuth } from '../context/AuthContext';
import DayStrip from '../components/schedule/DayStrip';
import CountdownBanner from '../components/schedule/CountdownBanner';
import FilterBar from '../components/schedule/FilterBar';
import EventCard from '../components/schedule/EventCard';
import CompactCard from '../components/schedule/CompactCard';
import EmptyState from '../components/shared/EmptyState';
import LoadingSkeleton from '../components/shared/LoadingSkeleton';
import CreateActivityWizard from '../components/wizard/CreateActivityWizard';

export default function SchedulePage() {
  const { activities, loading, refetch } = useActivities();
  const { programs } = usePrograms();
  const { orgId } = useAuth();
  const rsvpCounts = useEventRsvpCounts(activities);
  useScheduleScroll(loading, activities.length > 0);
  const [selectedDate, setSelectedDate] = useState(null);
  const [filters, setFilters] = useState({ teamId: null, eventType: 'all' });
  const [density, setDensity] = useState('comfortable');
  const [showWizard, setShowWizard] = useState(false);

  const filtered = useMemo(() => {
    let list = activities;
    if (filters.teamId) list = list.filter((a) => a.team_id === filters.teamId);
    if (filters.eventType !== 'all') list = list.filter((a) => a.event_type === filters.eventType);
    if (selectedDate) {
      const ds = selectedDate.toISOString().split('T')[0];
      list = list.filter((a) => a.date === ds);
    }
    return list;
  }, [activities, filters, selectedDate]);

  const grouped = useMemo(() => {
    const groups = {};
    filtered.forEach((a) => {
      const d = a.date || 'Unknown';
      if (!groups[d]) groups[d] = [];
      groups[d].push(a);
    });
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  const now = new Date();
  const nextEvent = activities.find((a) => {
    const t = new Date(`${a.date}T${a.start_time || '00:00'}`);
    return t > now;
  });

  if (loading) return <div className="p-4"><LoadingSkeleton variant="card" count={4} /></div>;

  const Card = density === 'compact' ? CompactCard : EventCard;

  return (
    <>
      <div className="px-4 py-4 sf-fade-in">
      <div style={{ marginBottom: 4 }}>
        <h1 className="font-bold" style={{
          color: 'var(--sf-text-primary)', fontSize: 20,
          letterSpacing: '-0.025em',
        }}>Schedule</h1>
        <div style={{
          width: 32, height: 3, borderRadius: 999,
          backgroundColor: 'var(--sf-accent)', marginTop: 6,
        }} />
      </div>

      <DayStrip
        selectedDate={selectedDate || now}
        onSelectDate={setSelectedDate}
        activities={activities}
      />

      <CountdownBanner nextEvent={nextEvent} />

      <FilterBar
        teams={programs}
        filters={filters}
        onFilterChange={setFilters}
        density={density}
        onDensityChange={setDensity}
      />

      {filtered.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No events"
          description={selectedDate ? 'Nothing scheduled for this day.' : 'No events match your filters.'}
        />
      ) : (
        <div className="flex flex-col gap-2" style={{ marginTop: 8 }}>
          {grouped.map(([date, events]) => (
            <div key={date} data-date-group={date}>
              <div style={{
                fontSize: 11, fontWeight: 600, letterSpacing: '0.05em',
                textTransform: 'uppercase', color: 'var(--sf-text-tertiary)',
                padding: '8px 0 4px',
              }}>
                {new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
                  weekday: 'long', month: 'short', day: 'numeric',
                })}
              </div>
              <div className={`flex flex-col ${density === 'compact' ? 'gap-1' : 'gap-2'}`}>
                {events.map((event, i) => (
                  <Card key={event.id} event={event} rsvpCount={rsvpCounts[event.id]} stagger={`sf-stagger-${Math.min(i + 1, 8)}`} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      </div>

      {/* Create FAB — sibling of .sf-fade-in so its transform doesn't
          form a containing block for this position:fixed element. */}
      <button
        type="button"
        onClick={() => setShowWizard(true)}
        className="sf-press sf-bounce-tap"
        aria-label="Create event"
        style={{
          position: 'fixed',
          bottom: 'calc(80px + env(safe-area-inset-bottom, 0px) + 8px)',
          right: 16,
          width: 56, height: 56, borderRadius: 28,
          backgroundColor: 'var(--sf-accent)',
          color: 'var(--sf-text-inverse)',
          border: 'none',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
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

import { useState, useMemo } from 'react';
import { Calendar } from 'lucide-react';
import { useActivities } from '../hooks/useActivities';
import { usePrograms } from '../hooks/usePrograms';
import DayStrip from '../components/schedule/DayStrip';
import CountdownBanner from '../components/schedule/CountdownBanner';
import FilterBar from '../components/schedule/FilterBar';
import EventCard from '../components/schedule/EventCard';
import CompactCard from '../components/schedule/CompactCard';
import EmptyState from '../components/shared/EmptyState';
import LoadingSkeleton from '../components/shared/LoadingSkeleton';

export default function SchedulePage() {
  const { activities, loading } = useActivities();
  const { programs } = usePrograms();
  const [selectedDate, setSelectedDate] = useState(null);
  const [filters, setFilters] = useState({ teamId: null, eventType: 'all' });
  const [density, setDensity] = useState('comfortable');

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
            <div key={date}>
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
                  <Card
                    key={event.id}
                    event={event}
                    stagger={`sf-stagger-${Math.min(i + 1, 8)}`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

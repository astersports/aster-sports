import { groupByDate, formatDateHeader } from '../../lib/scheduleHelpers';
import EventCard from './EventCard';

export default function DateGroupedList({ events, rsvpCounts, rideCounts }) {
  return groupByDate(events).map(([date, evts]) => (
    <div key={date} data-date-group={date}>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--sf-text-tertiary)', marginTop: 12, marginBottom: 6, textTransform: 'uppercase' }}>
        {formatDateHeader(date)}
      </div>
      {evts.map((event) => (
        <EventCard key={event.id} event={event} rsvpCount={rsvpCounts?.[event.id]} rideCount={rideCounts?.[event.id]} />
      ))}
    </div>
  ));
}

import { formatDateHeader, groupByDate } from '../../lib/scheduleHelpers';
import { getWeatherForTime } from '../../hooks/useWeather';
import EventCard from './EventCard';

export default function DateGroupedList({ events, rsvpCounts, rideCounts, dutyCounts, nextEventId, density, gameResults, weather, onRsvpChange }) {
  return groupByDate(events).map(([date, evts]) => (
    <div key={date} data-date-group={date}>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--em-text-tertiary)', marginTop: 8, marginBottom: 6, textTransform: 'uppercase' }}>
        {formatDateHeader(date)}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {evts.map((event) => (
        <EventCard
          key={event.id}
          event={event}
          rsvpCount={rsvpCounts?.[event.id]}
          rideCount={rideCounts?.[event.id]}
          dutyCount={dutyCounts?.[event.id]}
          isNext={event.id === nextEventId}
          density={density}
          gameResult={gameResults?.[event.id]}
          weather={getWeatherForTime(weather, event.start_at)}
          onRsvpChange={onRsvpChange}
        />
      ))}
      </div>
    </div>
  ));
}

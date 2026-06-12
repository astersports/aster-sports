import { formatDateHeader, groupByDate } from '../../lib/scheduleHelpers';
import { getWeatherForTime } from '../../hooks/useWeather';
import EventCard from './EventCard';

// `data` is the useScheduleData bundle — counts, batch RSVP/activation
// maps, commitments, suppression, weather all ride it (VF-11: zero
// per-card requests downstream of here).
export default function DateGroupedList({ events, data, nextEventId, density, onRsvpChange }) {
  return groupByDate(events).map(([date, evts]) => (
    <div key={date} data-date-group={date}>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--as-text-tertiary)', marginTop: 8, marginBottom: 6, textTransform: 'uppercase' }}>
        {formatDateHeader(date)}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {evts.map((event) => (
        <EventCard
          key={event.id}
          event={event}
          rsvpCount={data.counts?.[event.id]}
          rideCount={data.rideCounts?.[event.id]}
          dutyCount={data.dutyCounts?.[event.id]}
          isNext={event.id === nextEventId}
          density={density}
          gameResult={data.gameResults?.[event.id]}
          weather={getWeatherForTime(data.weather, event.start_at)}
          childRsvpMap={data.childRsvpMap}
          activatedMap={data.activatedMap}
          commitment={data.commitments?.[event.id]}
          suppressCount={data.countSuppressedByTeam?.[event.team_id]}
          onRsvpChange={onRsvpChange}
        />
      ))}
      </div>
    </div>
  ));
}

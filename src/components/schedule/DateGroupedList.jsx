import { formatDateHeader, groupByDate } from '../../lib/scheduleHelpers';
import { getWeatherForTime } from '../../hooks/useWeather';
import EventCard from './EventCard';

// `data` is the useScheduleData bundle — counts, batch RSVP/activation
// maps, commitments, suppression, weather all ride it (VF-11: zero
// per-card requests downstream of here).
export default function DateGroupedList({ events, data, nextEventId, density, onRsvpChange }) {
  // R2-4: TODAY gets a header state (accent dot + label).
  const todayNY = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
  return groupByDate(events).map(([date, evts]) => (
    <div key={date} data-date-group={date}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: date === todayNY ? 'var(--as-accent)' : 'var(--as-text-tertiary)', marginTop: 8, marginBottom: 6, textTransform: 'uppercase' }}>
        {date === todayNY && <span aria-hidden="true" style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: 'var(--as-accent)' }} />}
        {/* formatDateHeader already appends "· TODAY" for today — don't double it. */}
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

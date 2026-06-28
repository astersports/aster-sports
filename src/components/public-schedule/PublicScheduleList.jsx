// E1: renders the day-grouped event list for the public schedule. An outer
// <ol> of day groups; each group is a sticky day header + an inner <ol> of
// event rows, so the structure is semantically a list-of-lists for screen
// readers. Fade-in honors prefers-reduced-motion via the shared as-fade-in
// class. Pure render — grouping/labels are derived from the injected `now`.

import PublicScheduleDayHeader from './PublicScheduleDayHeader';
import PublicScheduleEventRow from './PublicScheduleEventRow';
import { dayLabel } from './groupEventsByDay';

export default function PublicScheduleList({ groups, now, todayKey, accentColor }) {
  return (
    <ol className="as-fade-in" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
      {groups.map((group) => (
        <li key={group.key}>
          <PublicScheduleDayHeader
            label={dayLabel(group.key, now)}
            count={group.events.length}
            isToday={group.key === todayKey}
          />
          <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {group.events.map((e) => (
              <PublicScheduleEventRow key={e.id} event={e} accentColor={accentColor} />
            ))}
          </ol>
        </li>
      ))}
    </ol>
  );
}

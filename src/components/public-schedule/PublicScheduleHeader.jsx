// E5/E10: public-schedule page header. Org eyebrow + team title + accent
// rule + a "Next up" line that names the soonest event with an NY-pinned
// relative countdown (formatCountdown), so a parent landing on the page sees
// the most actionable fact first. Countdown is computed from an injected
// `now` (the page memoizes it once per load) so this stays pure — no
// Date.now() in render. Token-only colors; team_color is the one allowed
// inline DB hex.

import { CalendarClock } from 'lucide-react';
import { formatEventTitleString } from '../../lib/eventTitle';
import { countdownTo } from './groupEventsByDay';

export default function PublicScheduleHeader({ team, orgName, eventCount, nextEvent, now }) {
  const accent = team.team_color || 'var(--as-accent)';
  return (
    <header style={{ textAlign: 'center', marginBottom: 24 }}>
      {orgName && (
        <div style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--as-text-secondary)' }}>
          {orgName}
        </div>
      )}
      <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--as-text-primary)', margin: '4px 0', lineHeight: 1.2 }}>
        {team.name}
      </h1>
      <div style={{ width: 32, height: 3, backgroundColor: accent, borderRadius: 2, margin: '8px auto' }} aria-hidden="true" />
      <div style={{ fontSize: 13, color: 'var(--as-text-secondary)' }}>
        Upcoming schedule · {eventCount} event{eventCount !== 1 ? 's' : ''}
      </div>
      {nextEvent && (
        <div
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 12,
            padding: '6px 12px', borderRadius: 9999, backgroundColor: 'var(--as-accent-soft)',
            color: 'var(--as-accent)', fontSize: 13, fontWeight: 500, maxWidth: '100%',
          }}
        >
          <CalendarClock size={14} strokeWidth={1.75} aria-hidden="true" />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            Next up: {formatEventTitleString(nextEvent)} · {countdownTo(nextEvent.start_at, now)}
          </span>
        </div>
      )}
    </header>
  );
}

import { memo, useMemo } from 'react';
import { useNow } from '../../hooks/useNow';
import { eventTimeState } from '../../lib/eventWindows';
import DateGroupedList from './DateGroupedList';
import PastEventsSection from './PastEventsSection';
import TextEmptyState from '../shared/TextEmptyState';
import Label from '../shared/Label';
import DensityToggle from '../home/DensityToggle';
import { isStaff } from '../../lib/permissions';

// SD-2 three-band spine (SCHEDULE_L99_BUILD_SPEC §1.2): HAPPENING NOW
// (only when live) -> UPCOMING (NOW slot pinned = first upcoming) ->
// COMPLETED (collapsed). Partitions read eventTimeState — the start_at
// comparisons that dropped in-progress events into "Past 7 days"
// mid-game are gone. useNow stays lifted here (perf-pass Finding #2)
// so the 60s tick re-renders only the time-dependent slice.
function ScheduleListSections({ filtered, data, density, role }) {
  const nowMs = useNow();
  const weekEnd = useMemo(() => new Date(nowMs + 7 * 24 * 60 * 60 * 1000), [nowMs]);

  const { live, upcoming, later } = useMemo(() => {
    const out = { live: [], upcoming: [], later: [] };
    filtered.forEach((a) => {
      const state = eventTimeState(a, nowMs);
      if (state === 'completed') return; // PastEventsSection owns completed
      if (state === 'happening_now') {
        if (a.status !== 'cancelled') out.live.push(a);
        else out.upcoming.push(a); // cancelled mid-window: dimmed card, no Live badge
      } else if (new Date(a.start_at) <= weekEnd) out.upcoming.push(a);
      else out.later.push(a);
    });
    return out;
  }, [filtered, nowMs, weekEnd]);
  const nextEventId = upcoming.find((a) => a.status !== 'cancelled')?.id || later.find((a) => a.status !== 'cancelled')?.id || null;

  return (
    <>
      {live.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <div className="flex items-center" style={{ gap: 8, marginBottom: 8 }}>
            <span aria-hidden="true" className="as-pulse-dot" style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--as-success)', boxShadow: '0 0 0 3px var(--as-success-soft)' }} />
            <Label style={{ marginBottom: 0 }}>Happening now</Label>
          </div>
          <DateGroupedList events={live} data={data} density={density} onRsvpChange={data.onRsvpSaved} />
        </div>
      )}
      {upcoming.length === 0 && live.length === 0 ? (
        <TextEmptyState heading="No events this week" message={isStaff(role) ? 'Tap + to get something on the books.' : 'Check back — Coach has something in the works.'} />
      ) : upcoming.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
            <Label style={{ marginBottom: 0 }}>Next 7 days</Label>
            <DensityToggle sectionKey="default" />
          </div>
          <DateGroupedList events={upcoming} data={data} nextEventId={nextEventId} density={density} onRsvpChange={data.onRsvpSaved} />
        </div>
      )}
      {later.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <Label>Later</Label>
          <DateGroupedList events={later} data={data} nextEventId={nextEventId} density={density} onRsvpChange={data.onRsvpSaved} />
        </div>
      )}
      <PastEventsSection activities={filtered} data={data} density={density} />
    </>
  );
}

export default memo(ScheduleListSections);

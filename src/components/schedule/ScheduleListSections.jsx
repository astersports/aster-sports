import { memo, useMemo } from 'react';
import { useNow } from '../../hooks/useNow';
import DateGroupedList from './DateGroupedList';
import PastEventsSection from './PastEventsSection';
import TextEmptyState from '../shared/TextEmptyState';
import Label from '../shared/Label';
import DensityToggle from '../home/DensityToggle';
import { isStaff } from '../../lib/permissions';

// 2026-05-21 (perf-pass Finding #2) — useNow lifted OUT of SchedulePage
// into this slot. Without this wrapper, the 60s useNow tick re-rendered
// the whole page subtree (WeekStrip, FilterBar, ChildFilterChips,
// ViewToggle, ShareScheduleButton) even though none of those care about
// time. Only the upcoming/remaining/empty-state slice is genuinely
// time-dependent — those filters live here now.
//
// Parent passes raw `filtered` events (filter logic is time-agnostic);
// this component derives the time-windowed slices internally.
// Reference: PR #428 (TeamDetailHeroSlot — same pattern for team
// detail nextEvent).
function ScheduleListSections({ filtered, rsvpCounts, rideCounts, dutyCounts, density, gameResults, weather, onRsvpChange, role }) {
  const nowMs = useNow();
  const weekEnd = useMemo(() => new Date(nowMs + 7 * 24 * 60 * 60 * 1000), [nowMs]);

  const lookbackMs = 0;
  const upcoming = useMemo(() => {
    const cutoff = new Date(nowMs - lookbackMs);
    return filtered.filter((a) => new Date(a.start_at) >= cutoff && new Date(a.start_at) <= weekEnd);
  }, [filtered, nowMs, lookbackMs, weekEnd]);
  const nextEventId = upcoming.find((a) => new Date(a.start_at).getTime() >= nowMs)?.id || null;
  const remaining = useMemo(() => filtered.filter((a) => new Date(a.start_at) > weekEnd), [filtered, weekEnd]);

  return (
    <>
      {upcoming.length === 0 ? (
        <TextEmptyState heading="No events this week" message={isStaff(role) ? "Tap + to get something on the books." : "Check back — Coach has something in the works."} />
      ) : (
        <div style={{ marginTop: 8 }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
            <Label style={{ marginBottom: 0 }}>Next 7 days</Label>
            <DensityToggle sectionKey="schedule-list" />
          </div>
          <DateGroupedList events={upcoming} rsvpCounts={rsvpCounts} rideCounts={rideCounts} dutyCounts={dutyCounts} nextEventId={nextEventId} density={density} gameResults={gameResults} weather={weather} onRsvpChange={onRsvpChange} />
        </div>
      )}
      {remaining.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <Label>Later</Label>
          <DateGroupedList events={remaining} rsvpCounts={rsvpCounts} rideCounts={rideCounts} dutyCounts={dutyCounts} density={density} gameResults={gameResults} weather={weather} onRsvpChange={onRsvpChange} />
        </div>
      )}
      <PastEventsSection activities={filtered} rsvpCounts={rsvpCounts} rideCounts={rideCounts} dutyCounts={dutyCounts} gameResults={gameResults} weather={weather} onRsvpChange={onRsvpChange} />
    </>
  );
}

export default memo(ScheduleListSections);

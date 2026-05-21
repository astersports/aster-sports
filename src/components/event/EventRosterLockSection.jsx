import { memo } from 'react';
import { useEventRosterLock } from '../../hooks/useEventRosterLock';
import EventRosterLockCard from './EventRosterLockCard';

// 2026-05-20 L99 PR A: was a wrapper rendering both EventRosterLockCard
// AND AcademyCallupPicker. AcademyCallupPicker moved to its own
// CollapsibleSection on EventDetailPage (~250-400px always-on card
// becomes collapsible). This component now only wires the lock card.
// 2026-05-21 EventDetail perf pass (PR #428 pattern): memo-wrapped so
// parent re-renders skip this subtree when props are referentially equal.

const VISIBLE_TYPES = new Set(['game', 'tournament']);

function EventRosterLockSection({ event, isStaff, rsvps, roster, onChange }) {
  const lock = useEventRosterLock(event?.id);
  if (!event || !VISIBLE_TYPES.has(event.event_type) || !event.team_id) return null;
  return <EventRosterLockCard event={event} isStaff={isStaff} rsvps={rsvps} roster={roster} lock={lock} onChange={onChange} />;
}

export default memo(EventRosterLockSection);

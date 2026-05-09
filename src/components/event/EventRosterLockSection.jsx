import { useEventRosterLock } from '../../hooks/useEventRosterLock';
import EventRosterLockCard from './EventRosterLockCard';
import AcademyCallupPicker from './AcademyCallupPicker';

// Owns useEventRosterLock once and shares state across the lock card and
// the academy callup picker. Mounts on event detail under the score block
// when the event is tournament/game and there's a team_id.

const VISIBLE_TYPES = new Set(['game', 'tournament']);

export default function EventRosterLockSection({ event, team, isStaff, rsvps, roster, onChange }) {
  const lock = useEventRosterLock(event?.id);
  if (!event || !VISIBLE_TYPES.has(event.event_type) || !event.team_id) return null;

  return (
    <>
      <EventRosterLockCard
        event={event} isStaff={isStaff}
        rsvps={rsvps} roster={roster}
        lock={lock} onChange={onChange}
      />
      <AcademyCallupPicker
        event={event} team={team}
        isStaff={isStaff}
        isLocked={lock.isLocked}
        academyCallupPlayerIds={lock.academyCallupPlayerIds}
        addCallup={lock.addCallup}
        removeCallup={lock.removeCallup}
      />
    </>
  );
}

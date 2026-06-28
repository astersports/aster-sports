import { CalendarDays } from 'lucide-react';
import { useNow } from '../../hooks/useNow';

// L99 SchedulePage enhancement #4: once a parent taps a future day in
// the WeekStrip the list scrolls away from today with no quick way back.
// This renders a sticky "Jump to today" pill (only while a non-today day
// is selected) that clears the day filter and re-anchors. Timezone-pinned
// to America/New_York (AP #43 timezone pin) so "today" matches the rest
// of the schedule's NY-anchored day math.
export default function JumpToTodayBar({ selectedDate, onJump }) {
  const nowMs = useNow();
  const todayNY = new Date(nowMs).toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
  if (!selectedDate || selectedDate === todayNY) return null;

  return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: 4 }}>
      <button
        type="button"
        onClick={() => { navigator.vibrate?.(10); onJump(); }}
        className="as-press"
        aria-label="Clear day filter and jump back to today"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, minHeight: 44, padding: '0 16px',
          borderRadius: 999, border: '1px solid var(--as-border-default)', backgroundColor: 'var(--as-bg-card)',
          color: 'var(--as-accent)', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer',
          boxShadow: 'var(--as-shadow-sm)',
        }}
      >
        <CalendarDays size={16} strokeWidth={1.75} aria-hidden="true" />
        Jump to today
      </button>
    </div>
  );
}

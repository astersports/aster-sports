import { useMemo } from 'react';

const DAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// SD-8 fix-in-place (SCHEDULE_L99_BUILD_SPEC §2 PR-C', R12 class): the
// old cells mixed an NY-pinned dateStr with BROWSER-LOCAL getDate()/
// getDay() labels — any non-NY viewer near a day boundary saw day
// numbers that didn't match the bucket they filtered. Cells now derive
// every field from one NY-anchored date-only value, stepped with UTC
// calendar arithmetic (DST-proof: no 24h instant-stepping).
export default function WeekStrip({ eventDates, selectedDate, onSelect }) {
  const days = useMemo(() => {
    const todayNY = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
    const [y, m, d] = todayNY.split('-').map(Number);
    return Array.from({ length: 7 }, (_, i) => {
      const cell = new Date(Date.UTC(y, m - 1, d + i, 12)); // noon-UTC anchor, calendar-day step
      return {
        dateStr: cell.toISOString().slice(0, 10),
        dayNum: cell.getUTCDate(),
        dayAbbr: DAY_ABBR[cell.getUTCDay()],
        isToday: i === 0,
      };
    });
  }, []);

  const dateSet = useMemo(() => new Set(eventDates || []), [eventDates]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 4, padding: '8px 0 4px' }} role="tablist" aria-label="Week days">
      {days.map((d) => {
        const isActive = selectedDate === d.dateStr;
        const hasEvents = dateSet.has(d.dateStr);
        return (
          <button key={d.dateStr} type="button" role="tab" aria-selected={isActive} aria-label={`${d.dayAbbr} ${d.dayNum}${hasEvents ? ', has events' : ''}`}
            onClick={() => { navigator.vibrate?.(10); onSelect(isActive ? null : d.dateStr); }}
            className="as-press"
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '6px 10px',
              borderRadius: 12, border: 'none', fontFamily: 'inherit', cursor: 'pointer', minWidth: 42,
              backgroundColor: isActive ? 'var(--as-accent)' : d.isToday ? 'var(--as-accent-soft)' : 'transparent',
              color: isActive ? 'var(--as-text-inverse)' : 'var(--as-text-primary)',
            }}
          >
            <span style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', opacity: isActive ? 1 : 0.6 }}>{d.dayAbbr}</span>
            <span style={{ fontSize: 17, fontWeight: 700, lineHeight: 1.2 }}>{d.dayNum}</span>
            <span style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: hasEvents ? (isActive ? 'var(--as-text-inverse)' : 'var(--as-accent)') : 'transparent' }} />
          </button>
        );
      })}
    </div>
  );
}

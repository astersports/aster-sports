import { useMemo } from 'react';
import { useNow } from '../../hooks/useNow';

const DAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// SD-8 fix-in-place (PR-C' mechanics + PR-F' R2 finish): cells derive
// every field from one NY-anchored date-only value, stepped with UTC
// calendar arithmetic (DST-proof; was NY dateStr + browser-local
// labels). PR-F' adds: plain buttons + aria-pressed (the tab roles
// were semantically wrong — these filter, they don't switch panels),
// 44px tap floor, and a live "today" (the strip re-anchors when the
// NY day rolls over instead of going stale overnight).
export default function WeekStrip({ eventDates, selectedDate, onSelect }) {
  const nowMs = useNow();
  const todayNY = new Date(nowMs).toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
  const days = useMemo(() => {
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
  }, [todayNY]);

  const dateSet = useMemo(() => new Set(eventDates || []), [eventDates]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 4, padding: '8px 0 4px' }} aria-label="Filter by day">
      {days.map((d) => {
        const isActive = selectedDate === d.dateStr;
        const hasEvents = dateSet.has(d.dateStr);
        return (
          <button key={d.dateStr} type="button" aria-pressed={isActive} aria-label={`${d.dayAbbr} ${d.dayNum}${hasEvents ? ', has events' : ''}`}
            onClick={() => { navigator.vibrate?.(10); onSelect(isActive ? null : d.dateStr); }}
            className="as-press"
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '6px 10px',
              borderRadius: 12, border: 'none', fontFamily: 'inherit', cursor: 'pointer', minWidth: 44, minHeight: 44,
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

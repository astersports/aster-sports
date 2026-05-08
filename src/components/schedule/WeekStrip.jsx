import { useMemo } from 'react';

const DAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function WeekStrip({ eventDates, selectedDate, onSelect }) {
  const days = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dateStr = d.toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
      return { dateStr, dayNum: d.getDate(), dayAbbr: DAY_ABBR[d.getDay()], isToday: i === 0 };
    });
  }, []);

  const dateSet = useMemo(() => new Set(eventDates || []), [eventDates]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 4, padding: '8px 0 4px' }} role="tablist" aria-label="Week days">
      {days.map((d) => {
        const isActive = selectedDate === d.dateStr;
        const hasEvents = dateSet.has(d.dateStr);
        return (
          <button key={d.dateStr} type="button" role="tab" aria-selected={isActive} aria-label={`${d.dayAbbr} ${d.dayNum}`}
            onClick={() => { navigator.vibrate?.(10); onSelect(isActive ? null : d.dateStr); }}
            className="sf-press"
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '6px 10px',
              borderRadius: 12, border: 'none', fontFamily: 'inherit', cursor: 'pointer', minWidth: 42,
              backgroundColor: isActive ? 'var(--em-accent)' : d.isToday ? 'var(--em-accent-soft)' : 'transparent',
              color: isActive ? 'var(--em-text-inverse)' : 'var(--em-text-primary)',
            }}
          >
            <span style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', opacity: isActive ? 1 : 0.6 }}>{d.dayAbbr}</span>
            <span style={{ fontSize: 17, fontWeight: 700, lineHeight: 1.2 }}>{d.dayNum}</span>
            <span style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: hasEvents ? (isActive ? 'var(--em-text-inverse)' : 'var(--em-accent)') : 'transparent' }} />
          </button>
        );
      })}
    </div>
  );
}

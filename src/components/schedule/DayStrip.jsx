import { useMemo, useRef, useEffect } from 'react';
import { getSeasonRange, enumerateDates, isSameDay } from './dayStripDates';

const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']; // Mon..Sun

export default function DayStrip({ selectedDate, onSelectDate, activities }) {
  const today = new Date();
  const scrollRef = useRef(null);

  const allDays = useMemo(() => {
    const [start, end] = getSeasonRange(activities);
    return enumerateDates(start, end);
  }, [activities]);

  useEffect(() => {
    const el = scrollRef.current?.querySelector('[data-today="true"]');
    if (el) el.scrollIntoView({ inline: 'center', behavior: 'instant' });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allDays.length]);

  return (
    <div
      ref={scrollRef}
      className="flex gap-1 overflow-x-auto sf-no-scrollbar"
      style={{ padding: '8px 0' }}
    >
      {allDays.map((date, i) => {
        const isToday = isSameDay(date, today);
        const isSelected = selectedDate && isSameDay(date, selectedDate);
        const dateStr = date.toISOString().split('T')[0];
        const dayEvents = (activities || []).filter((a) => a.date === dateStr);
        const teamColors = [...new Set(dayEvents.map((a) => a.teams?.team_color).filter(Boolean))];
        const dayLabel = DAY_LETTERS[(date.getDay() + 6) % 7];

        return (
          <button
            key={i}
            type="button"
            data-today={isToday || undefined}
            onClick={() => { navigator.vibrate?.(10); onSelectDate(isSelected ? null : date); }}
            className="sf-press flex flex-col items-center"
            style={{
              minWidth: 40, flexShrink: 0,
              padding: '6px 4px',
              borderRadius: 10,
              backgroundColor: isSelected ? 'var(--sf-accent)' : 'transparent',
              border: isToday && !isSelected ? '1.5px solid var(--sf-accent)' : '1.5px solid transparent',
            }}
          >
            <span style={{
              fontSize: 10,
              fontWeight: 500,
              color: isSelected ? 'var(--sf-text-inverse)' : 'var(--sf-text-tertiary)',
            }}>{dayLabel}</span>
            <span style={{
              fontSize: 15,
              fontWeight: isToday ? 700 : 500,
              color: isSelected ? 'var(--sf-text-inverse)' : isToday ? 'var(--sf-accent)' : 'var(--sf-text-primary)',
              marginTop: 2,
            }}>{date.getDate()}</span>
            <div className="flex gap-1" style={{ marginTop: 3, minHeight: 4 }}>
              {teamColors.slice(0, 3).map((c, ci) => (
                <div key={ci} style={{
                  width: 4, height: 4, borderRadius: '50%',
                  backgroundColor: c,
                }} />
              ))}
            </div>
          </button>
        );
      })}
    </div>
  );
}

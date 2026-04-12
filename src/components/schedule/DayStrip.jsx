import { useRef, useEffect } from 'react';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function getWeekDays(baseDate) {
  const d = new Date(baseDate);
  const day = d.getDay();
  const monday = new Date(d);
  monday.setDate(d.getDate() - ((day + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    return date;
  });
}

export default function DayStrip({ selectedDate, onSelectDate, activities }) {
  const today = new Date();
  const week = getWeekDays(selectedDate || today);
  const scrollRef = useRef(null);

  useEffect(() => {
    const el = scrollRef.current?.querySelector('[data-today="true"]');
    if (el) el.scrollIntoView({ inline: 'center', behavior: 'smooth' });
  }, []);

  return (
    <div
      ref={scrollRef}
      className="flex gap-1 overflow-x-auto sf-no-scrollbar"
      style={{ padding: '8px 0' }}
    >
      {week.map((date, i) => {
        const isToday = isSameDay(date, today);
        const isSelected = selectedDate && isSameDay(date, selectedDate);
        const dateStr = date.toISOString().split('T')[0];
        const dayEvents = (activities || []).filter((a) => a.date === dateStr);
        const teamColors = [...new Set(dayEvents.map((a) => a.teams?.team_color).filter(Boolean))];

        return (
          <button
            key={i}
            type="button"
            data-today={isToday || undefined}
            onClick={() => { navigator.vibrate?.(10); onSelectDate(date); }}
            className="sf-press flex flex-col items-center"
            style={{
              minWidth: 44,
              padding: '6px 4px',
              borderRadius: 10,
              backgroundColor: isSelected ? 'var(--sf-accent)' : 'transparent',
              border: isToday && !isSelected ? '1.5px solid var(--sf-accent)' : '1.5px solid transparent',
            }}
          >
            <span style={{
              fontSize: 11,
              fontWeight: 500,
              color: isSelected ? 'var(--sf-text-inverse)' : 'var(--sf-text-tertiary)',
            }}>{DAYS[i]}</span>
            <span style={{
              fontSize: 16,
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

// E1: sticky NY-day section header for the public schedule. Shows the
// relative day label ("Today" / "Tomorrow" / "Sat, Apr 13") plus the count
// of events that day. Sticky so the viewer always knows which day they're
// scrolling through. Token-only colors; uppercase label per §7 typography.

export default function PublicScheduleDayHeader({ label, count, isToday }) {
  return (
    <div
      style={{
        position: 'sticky', top: 0, zIndex: 1,
        display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
        padding: '8px 4px', margin: '16px 0 8px',
        backgroundColor: 'var(--as-bg-page)',
      }}
    >
      <span
        style={{
          fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em',
          color: isToday ? 'var(--as-accent)' : 'var(--as-text-secondary)',
        }}
      >
        {label}
      </span>
      <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--as-text-tertiary)' }}>
        {count} event{count !== 1 ? 's' : ''}
      </span>
    </div>
  );
}

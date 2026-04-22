// Shared RSVP count row rendered on NextUpCard, EventCard, CompactCard.
// Four states: going / maybe / not_going / noResponse. Zero-valued states
// are hidden to reduce visual noise. Accepts optional `compact` for tighter
// spacing on the schedule list.

function RsvpCountRow({ rsvpCount, compact = false }) {
  if (!rsvpCount) return null;

  const fontSize = compact ? 12 : 13;
  const gap = compact ? 8 : 10;

  const states = [
    { value: rsvpCount.going, label: 'going', color: 'var(--sf-success)' },
    { value: rsvpCount.maybe, label: 'maybe', color: 'var(--sf-warning)' },
    { value: rsvpCount.not_going, label: 'not going', color: 'var(--sf-danger)' },
    { value: rsvpCount.noResponse, label: 'no response', color: 'var(--sf-neutral)' },
  ].filter((s) => s.value > 0);

  if (states.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap, fontSize, color: 'var(--sf-text-secondary)' }}>
      {states.map((s) => (
        <span key={s.label}>
          <strong style={{ color: s.color }}>{s.value}</strong> {s.label}
        </span>
      ))}
    </div>
  );
}

export default RsvpCountRow;

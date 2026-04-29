// Shared RSVP count row rendered on NextUpCard, EventCard, CompactCard.
// Four states: going / maybe / not_going / noResponse. Zero-valued states
// are hidden to reduce visual noise. Accepts optional `compact` for tighter
// type sizing on the schedule list.
//
// Inline ` · ` separator between pills (was a flex `gap` previously, which
// could collapse on certain mobile font/CSS edge cases producing the
// "1 going12 no response" no-space rendering).

function RsvpCountRow({ rsvpCount, compact = false }) {
  if (!rsvpCount) return null;

  const fontSize = compact ? 12 : 13;

  const states = [
    { value: rsvpCount.going, label: 'going', color: 'var(--em-success)' },
    { value: rsvpCount.maybe, label: 'maybe', color: 'var(--em-warning)' },
    { value: rsvpCount.not_going, label: 'not going', color: 'var(--em-danger)' },
    { value: rsvpCount.noResponse, label: 'no response', color: 'var(--em-neutral)' },
  ].filter((s) => s.value > 0);

  if (states.length === 0) return null;

  return (
    <div style={{ fontSize, color: 'var(--em-text-secondary)' }}>
      {states.map((s, i) => (
        <span key={s.label}>
          {i > 0 ? <span style={{ margin: '0 6px', color: 'var(--em-text-tertiary)' }}>·</span> : null}
          <strong style={{ color: s.color }}>{s.value}</strong> {s.label}
        </span>
      ))}
    </div>
  );
}

export default RsvpCountRow;

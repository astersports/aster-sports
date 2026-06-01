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

  const fontSize = compact ? 11 : 13;
  const labels = compact
    ? { going: 'G', maybe: 'M', not_going: 'N', noResponse: 'NR' }
    : { going: 'going', maybe: 'maybe', not_going: 'not going', noResponse: 'no response' };

  const states = [
    { value: rsvpCount.going, label: labels.going, color: 'var(--as-success)' },
    { value: rsvpCount.maybe, label: labels.maybe, color: 'var(--as-warning)' },
    { value: rsvpCount.not_going, label: labels.not_going, color: 'var(--as-danger)' },
    { value: rsvpCount.noResponse, label: labels.noResponse, color: 'var(--as-neutral)' },
  ].filter((s) => s.value > 0);

  if (states.length === 0) return null;

  return (
    <div style={{ fontSize, color: 'var(--as-text-secondary)', whiteSpace: 'nowrap' }}>
      {states.map((s, i) => (
        <span key={s.label}>
          {i > 0 ? <span style={{ margin: '0 4px', color: 'var(--as-text-tertiary)' }}>·</span> : null}
          <strong style={{ color: s.color }}>{s.value}</strong>{compact ? '' : ' '}{s.label}
        </span>
      ))}
    </div>
  );
}

export default RsvpCountRow;

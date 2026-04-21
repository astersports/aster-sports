// RSVP counts + notes section on NextUpCard. Kept as its own component
// so NextUpCard stays under the 150-line ceiling as RSVP presentation
// grows (per-player notes below the counts, etc).
export default function NextUpCardRsvpSection({ rsvpCount }) {
  if (!rsvpCount) return null;
  return (
    <div style={{ display: 'flex', gap: 10, fontSize: 12, color: 'var(--sf-text-secondary)' }}>
      <span><strong style={{ color: 'var(--sf-success)' }}>{rsvpCount.going}</strong> going</span>
      <span><strong style={{ color: 'var(--sf-warning)' }}>{rsvpCount.maybe}</strong> maybe</span>
      <span><strong style={{ color: 'var(--sf-danger)' }}>{rsvpCount.not_going}</strong> not going</span>
      <span><strong style={{ color: 'var(--sf-neutral)' }}>{rsvpCount.noResponse}</strong> no response</span>
    </div>
  );
}

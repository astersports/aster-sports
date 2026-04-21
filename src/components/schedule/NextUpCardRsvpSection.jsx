import { useEventRsvpNotes } from '../../hooks/useEventRsvpNotes';

// RSVP counts + per-player notes on NextUpCard. Kept as its own
// component so NextUpCard stays under the 150-line ceiling as RSVP
// presentation grows.

const RESPONSE_LABEL = {
  going: 'Going',
  maybe: 'Maybe',
  not_going: 'Not Going',
};

function truncate(s, max = 60) {
  if (!s) return '';
  return s.length > max ? s.slice(0, max) + '…' : s;
}

export default function NextUpCardRsvpSection({ eventId, rsvpCount }) {
  const notes = useEventRsvpNotes(eventId);
  if (!rsvpCount) return null;
  const visible = notes.slice(0, 3);
  const extra = Math.max(0, notes.length - 3);
  return (
    <>
      <div style={{ display: 'flex', gap: 10, fontSize: 12, color: 'var(--sf-text-secondary)' }}>
        <span><strong style={{ color: 'var(--sf-success)' }}>{rsvpCount.going}</strong> going</span>
        <span><strong style={{ color: 'var(--sf-warning)' }}>{rsvpCount.maybe}</strong> maybe</span>
        <span><strong style={{ color: 'var(--sf-danger)' }}>{rsvpCount.not_going}</strong> not going</span>
        <span><strong style={{ color: 'var(--sf-neutral)' }}>{rsvpCount.noResponse}</strong> no response</span>
      </div>
      {notes.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--sf-text-tertiary)', marginBottom: 4 }}>
            RSVP Notes
          </div>
          {visible.map((n) => (
            <div key={n.playerId} style={{ fontSize: 12, marginTop: 5 }}>
              <span style={{ color: 'var(--sf-text-secondary)' }}>
                {n.firstName} ({RESPONSE_LABEL[n.response] || n.response}) —{' '}
              </span>
              <span style={{ color: 'var(--sf-text-primary)' }}>{truncate(n.comment)}</span>
            </div>
          ))}
          {extra > 0 && (
            <div style={{ fontSize: 12, fontStyle: 'italic', color: 'var(--sf-text-tertiary)', marginTop: 5 }}>
              +{extra} more
            </div>
          )}
        </div>
      )}
    </>
  );
}

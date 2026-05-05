// src/components/schedule/NextUpCardMyChild.jsx
// Step 5E-2b MAX-only "MY CHILD" subsection per HOME_DESIGN_SPEC.md
// §1.1.4 lines 280-282. Renders the parent's RSVP comment for their
// child on this event when one exists. Name + RSVP-status pills are
// already shown via the existing ChildRsvp widget at the bottom of
// the card; this section is the comment surface only.
import { useAuth } from '../../context/AuthContext';
import { useEventRsvpNotes } from '../../hooks/useEventRsvpNotes';

const LABEL_STYLE = {
  fontSize: 11, fontWeight: 600, letterSpacing: '0.05em',
  textTransform: 'uppercase', color: 'var(--em-text-tertiary)', marginBottom: 4,
};

export default function NextUpCardMyChild({ event }) {
  const { myChildren } = useAuth();
  const notes = useEventRsvpNotes(event.id);
  const childOnTeam = (myChildren || []).find((c) => c.teamIds?.includes(event.team_id) || c.teamId === event.team_id);
  if (!childOnTeam) return null;
  const note = notes.find((n) => n.playerId === childOnTeam.playerId);
  if (!note) return null;
  return (
    <div style={{ marginTop: 12 }}>
      <div style={LABEL_STYLE}>My Child</div>
      <div style={{ fontSize: 13, color: 'var(--em-text-primary)' }}>
        &ldquo;{note.comment}&rdquo;
        <span style={{ color: 'var(--em-text-secondary)' }}> &mdash; {note.firstName}</span>
      </div>
    </div>
  );
}

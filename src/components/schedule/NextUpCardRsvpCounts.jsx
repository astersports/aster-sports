// src/components/schedule/NextUpCardRsvpCounts.jsx
// Step 5E-2b MAX-only RSVP breakdown widget per HOME_DESIGN_SPEC.md
// §1.1.4 lines 274-279.
//
// Contract deviation from prompt: data source is the `rsvpCount` prop
// (already in scope on Med/Max via useEventRsvpCounts) instead of
// useEventRsvpNotes. The latter filters to comment-bearing rows only
// and would severely undercount. rsvpCount shape is:
//   { going, not_going, maybe, noResponse, total }

const LABEL_STYLE = {
  fontSize: 11, fontWeight: 600, letterSpacing: '0.05em',
  textTransform: 'uppercase', color: 'var(--em-text-tertiary)', marginBottom: 4,
};
const ROW_STYLE = { fontSize: 13, color: 'var(--em-text-secondary)', marginTop: 4 };

export default function NextUpCardRsvpCounts({ rsvpCount, rosterTotal }) {
  if (!rsvpCount) return null;
  const { going = 0, maybe = 0, not_going: notGoing = 0, noResponse = 0 } = rsvpCount;
  const total = rosterTotal ?? going + maybe + notGoing + noResponse;
  return (
    <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--em-border-subtle)' }}>
      <div style={LABEL_STYLE}>RSVP Status</div>
      <div style={ROW_STYLE}>Going: {going} of {total}</div>
      <div style={ROW_STYLE}>Maybe: {maybe}</div>
      <div style={ROW_STYLE}>Not going: {notGoing}</div>
      <div style={ROW_STYLE}>No response: {noResponse}</div>
    </div>
  );
}

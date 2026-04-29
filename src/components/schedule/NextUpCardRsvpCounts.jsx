// src/components/schedule/NextUpCardRsvpCounts.jsx
// MAX-only RSVP breakdown: label + single summary line + proportional
// stacked bar. Source is the rsvpCount prop (aggregate counts already
// in scope from useEventRsvpCounts), shape:
//   { going, not_going, maybe, noResponse, total }

const LABEL_STYLE = {
  fontSize: 11, fontWeight: 600, letterSpacing: '0.05em',
  textTransform: 'uppercase', color: 'var(--em-text-tertiary)', marginBottom: 4,
};
const SUMMARY_STYLE = { fontSize: 13, color: 'var(--em-text-secondary)', marginBottom: 6 };
const BAR_STYLE = {
  display: 'flex', height: 6, borderRadius: 9999,
  backgroundColor: 'var(--em-bg-tertiary)', overflow: 'hidden',
};

function Seg({ value, color }) {
  if (!value || value <= 0) return null;
  return <div style={{ flex: value, backgroundColor: color }} />;
}

export default function NextUpCardRsvpCounts({ rsvpCount, rosterTotal }) {
  if (!rsvpCount) return null;
  const { going = 0, maybe = 0, not_going: notGoing = 0, noResponse = 0 } = rsvpCount;
  const total = rosterTotal ?? going + maybe + notGoing + noResponse;
  if (total === 0) return null;
  return (
    <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--em-border-subtle)' }}>
      <div style={LABEL_STYLE}>RSVP</div>
      <div style={SUMMARY_STYLE}>
        {going} going · {maybe} maybe · {notGoing} not going · {noResponse} awaiting
      </div>
      <div style={BAR_STYLE}>
        <Seg value={going} color="var(--em-success)" />
        <Seg value={maybe} color="var(--em-warning)" />
        <Seg value={notGoing} color="var(--em-danger)" />
        <Seg value={noResponse} color="var(--em-text-tertiary)" />
      </div>
    </div>
  );
}

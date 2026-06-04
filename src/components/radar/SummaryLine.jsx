// Track-R R-1 — the auto 10-second summary on a ProposalCard. The text is
// built (END-AWARE for schedule_change) in radarFeedHelpers.summaryLine; this
// is a presentation-only leaf.

const style = { fontSize: 14, color: 'var(--as-text-secondary)', lineHeight: 1.4, margin: 0 };

export default function SummaryLine({ text }) {
  if (!text) return null;
  return <p style={style}>{text}</p>;
}

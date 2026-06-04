// Track-R R-1 — one proposal. Kind glyph (team_color dot from DB), kind
// eyebrow, anchor title, the 10-sec SummaryLine, AudiencePill, CardActions.
// Pure presentation over the view-model from useRadarFeed.

import SummaryLine from './SummaryLine';
import AudiencePill from './AudiencePill';
import CardActions from './CardActions';

const card = { backgroundColor: 'var(--as-bg-card)', border: '1px solid var(--as-border-default)', borderRadius: 10, padding: 16, boxShadow: 'var(--as-shadow-sm)', display: 'flex', flexDirection: 'column', gap: 8 };
const headRow = { display: 'flex', alignItems: 'center', gap: 8 };
const glyph = (color) => ({ width: 10, height: 10, borderRadius: 9999, backgroundColor: color || 'var(--as-neutral)', flexShrink: 0 });
const eyebrow = { fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--as-text-tertiary)' };
const titleStyle = { fontSize: 15, fontWeight: 600, color: 'var(--as-text-primary)', lineHeight: 1.2 };
const metaRow = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' };
const tag = { fontSize: 12, color: 'var(--as-text-tertiary)' };

export default function ProposalCard({ item, onReview, onDismiss, busy = false, showActions = true }) {
  return (
    <article style={card} aria-label={`${item.kindLabel}: ${item.title}`}>
      <div style={headRow}>
        <span style={glyph(item.teamColor)} aria-hidden="true" />
        <span style={eyebrow}>{item.kindLabel}</span>
      </div>
      <div style={titleStyle}>{item.title}</div>
      <SummaryLine text={item.summary} />
      <div style={metaRow}>
        <AudiencePill text={item.audience} />
        {item.status === 'scheduled' && <span style={tag}>Scheduled</span>}
        {item.status === 'sent' && <span style={tag}>Sent</span>}
      </div>
      {showActions && <CardActions onReview={onReview} onDismiss={onDismiss} busy={busy} />}
    </article>
  );
}

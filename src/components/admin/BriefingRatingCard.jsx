// Cutover PR 7b-3 — per-briefing rating card for BriefingHistoryDetail.
// Shows mean rating + count + distribution bars for a specific send.
// Empty state: "No ratings yet" when no feedback rows exist.

import { CUTOVER_GATE_THRESHOLD, useBriefingFeedback } from '../../hooks/useBriefingFeedback';

const card = { backgroundColor: 'var(--em-bg-card)', border: '1px solid var(--em-border-default)', borderRadius: 10, padding: 14 };
const labelStyle = { fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--em-text-tertiary)' };
const barRow = { display: 'grid', gridTemplateColumns: '24px 1fr 32px', gap: 8, alignItems: 'center', marginTop: 6 };
const barTrack = { height: 8, borderRadius: 4, backgroundColor: 'var(--em-bg-tertiary)', overflow: 'hidden' };
const barFill = (pct) => ({ width: `${pct}%`, height: '100%', backgroundColor: 'var(--em-accent)' });

export default function BriefingRatingCard({ messageId }) {
  const { meanRating, ratingCount, distribution, loading } = useBriefingFeedback({ messageId });

  if (loading) {
    return (
      <div style={card} role="status" aria-live="polite">
        <div style={labelStyle}>Family rating</div>
        <div style={{ marginTop: 6, fontSize: 13, color: 'var(--em-text-tertiary)' }}>Loading…</div>
      </div>
    );
  }
  if (!ratingCount) {
    return (
      <div style={card}>
        <div style={labelStyle}>Family rating</div>
        <div style={{ marginTop: 6, fontSize: 13, color: 'var(--em-text-tertiary)' }}>No ratings yet.</div>
      </div>
    );
  }
  const formatted = meanRating.toFixed(1);
  const atOrAbove = meanRating >= CUTOVER_GATE_THRESHOLD;
  return (
    <div style={card} data-testid="briefing-rating-card">
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 8 }}>
        <span style={labelStyle}>Family rating</span>
        <span style={{ fontSize: 24, fontWeight: 700, color: atOrAbove ? 'var(--em-success)' : 'var(--em-text-primary)' }}>{formatted}</span>
        <span style={{ fontSize: 13, color: 'var(--em-text-secondary)' }}>· {ratingCount} {ratingCount === 1 ? 'rating' : 'ratings'}</span>
      </div>
      {[5, 4, 3, 2, 1].map((rating) => {
        const count = distribution[rating] || 0;
        const pct = ratingCount ? (count / ratingCount) * 100 : 0;
        return (
          <div key={rating} style={barRow}>
            <span style={{ fontSize: 12, color: 'var(--em-text-secondary)', textAlign: 'right' }}>{rating}★</span>
            <div style={barTrack}><div style={barFill(pct)} aria-hidden="true" /></div>
            <span style={{ fontSize: 12, color: 'var(--em-text-tertiary)' }}>{count}</span>
          </div>
        );
      })}
    </div>
  );
}

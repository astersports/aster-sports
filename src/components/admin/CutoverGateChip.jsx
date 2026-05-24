// Cutover PR 7b-3 — cutover-gate metric chip. Surfaces the rolling
// average rating across the last 5 sent briefings, with a threshold
// flag at ≥4.0. Shown on AdminHomePage. (Previously also mounted on
// BriefingsInboxPage — retired 2026-05-23 §4.AI Option C PR A.)
// Render contract test (CutoverGateChipRender.test.jsx) locks the
// URL/value contract per AP #43.
//
// Loading state: subtle skeleton-style placeholder (no spinner — chip
// is small, brief flash is acceptable).
//
// Empty state: when no sent briefings have ratings yet, chip shows
// "—" and is non-actionable; no threshold pill.

import { useAuth } from '../../context/AuthContext';
import { CUTOVER_GATE_THRESHOLD, useBriefingFeedback } from '../../hooks/useBriefingFeedback';

const ROLLING_WINDOW = 5;

const wrapStyle = {
  display: 'inline-flex', alignItems: 'center', gap: 8,
  padding: '6px 12px', borderRadius: 9999,
  border: '1px solid var(--em-border-default)',
  backgroundColor: 'var(--em-bg-card)',
  fontSize: 13, fontWeight: 500, color: 'var(--em-text-secondary)',
  fontFamily: 'inherit',
};
const labelStyle = { fontSize: 11, fontWeight: 500, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--em-text-tertiary)' };
const valueStyle = (atOrAbove) => ({
  fontSize: 14, fontWeight: 700,
  color: atOrAbove ? 'var(--em-success)' : 'var(--em-text-primary)',
});
const thresholdPillStyle = (atOrAbove) => ({
  fontSize: 11, fontWeight: 600, padding: '2px 6px', borderRadius: 4,
  backgroundColor: atOrAbove ? 'var(--em-success-soft)' : 'var(--em-neutral-soft)',
  color: atOrAbove ? 'var(--em-success)' : 'var(--em-text-tertiary)',
});

export default function CutoverGateChip() {
  const { orgId } = useAuth();
  const { meanRating, ratingCount, messageCount, atOrAboveThreshold, loading } = useBriefingFeedback({ orgId, rolling: ROLLING_WINDOW });

  if (loading) {
    return <div aria-live="polite" aria-label="Loading cutover gate" style={{ ...wrapStyle, color: 'var(--em-text-tertiary)' }}>Cutover gate · …</div>;
  }
  if (meanRating == null) {
    return (
      <div aria-label={`Cutover gate: no ratings yet across last ${ROLLING_WINDOW} sent briefings`} style={wrapStyle}>
        <span style={labelStyle}>Cutover gate</span>
        <span style={{ color: 'var(--em-text-tertiary)' }}>— (no ratings yet)</span>
      </div>
    );
  }
  const formatted = meanRating.toFixed(1);
  const aria = `Cutover gate: ${formatted} of 5 across ${ratingCount} ratings on last ${messageCount} sent briefings. ${atOrAboveThreshold ? 'At or above' : 'Below'} ${CUTOVER_GATE_THRESHOLD.toFixed(1)} threshold.`;
  return (
    <div aria-label={aria} style={wrapStyle} data-testid="cutover-gate-chip">
      <span style={labelStyle}>Cutover gate</span>
      <span style={valueStyle(atOrAboveThreshold)}>{formatted}</span>
      <span style={{ fontSize: 12, color: 'var(--em-text-tertiary)' }}>· {ratingCount}/{messageCount} last sends</span>
      <span style={thresholdPillStyle(atOrAboveThreshold)} aria-hidden="true">{atOrAboveThreshold ? '≥ 4.0' : '< 4.0'}</span>
    </div>
  );
}

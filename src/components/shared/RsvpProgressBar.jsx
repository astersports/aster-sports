// 2026-05-21 (Teams PR B / V2) — slim RSVP progress bar surfacing
// going / maybe / out share of the team for the next event. Token-
// driven colors so org-brand overrides don't bleed into status
// semantics. Compact mode renders a 6px-tall track for the hero
// slot; full mode renders 10px-tall for surfaces like EventCard
// where more visual weight is appropriate.
//
// Cross-surface invariant per anti-pattern #43:
// `RsvpProgressBarCrossSurface.test.jsx` locks identical output
// between hero and EventCard for the same inputs.
export default function RsvpProgressBar({ going = 0, maybe = 0, out = 0, total = 0, compact = false }) {
  const safeTotal = Math.max(total, going + maybe + out, 1);
  const pct = (n) => Math.max(0, Math.min(100, (n / safeTotal) * 100));
  const height = compact ? 6 : 10;
  return (
    <div aria-label={`RSVP progress: ${going} going, ${maybe} maybe, ${out} out`}
      style={{
        display: 'flex', width: '100%', height, borderRadius: 999, overflow: 'hidden',
        backgroundColor: 'var(--as-bg-tertiary)',
      }}>
      <div style={{ width: `${pct(going)}%`, backgroundColor: 'var(--as-success)' }} />
      <div style={{ width: `${pct(maybe)}%`, backgroundColor: 'var(--as-text-tertiary)' }} />
      <div style={{ width: `${pct(out)}%`, backgroundColor: 'var(--as-text-secondary)' }} />
    </div>
  );
}

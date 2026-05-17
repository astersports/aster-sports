// Tier 3 v1 PR 3 — empty state for alert zone.
//
// Two render modes per Gap 1 lock:
//   mode="inline"  — full-width "All clear" empty state for admin
//                    alert zone (always visible, even when no alerts)
//   mode="pill"    — compact "✓ All clear" pill for parent/coach
//                    home (the high-frequency render since
//                    parent/coach alert density is naturally low)
//
// Same component, two display shapes. Don't duplicate per Gap 1.
// PR 4 (admin) consumes mode="inline". PR 5/6 (parent/coach) consume
// mode="pill".

import { CheckCircle2 } from 'lucide-react';

const INLINE = {
  display: 'flex', alignItems: 'center', gap: 10,
  padding: '16px 18px', borderRadius: 10,
  backgroundColor: 'var(--em-success-soft)',
  border: '1px solid var(--em-success)',
  color: 'var(--em-success)',
  fontSize: 14, fontWeight: 500,
};

const PILL = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '4px 10px', borderRadius: 999,
  backgroundColor: 'var(--em-success-soft)',
  color: 'var(--em-success)',
  fontSize: 12, fontWeight: 500,
};

export default function AllClearPill({ mode = 'inline', label }) {
  const style = mode === 'pill' ? PILL : INLINE;
  const iconSize = mode === 'pill' ? 14 : 18;
  const text = label || (mode === 'pill' ? 'All clear' : "All clear · no alerts firing");
  return (
    <div role="status" aria-label="All clear, no alerts firing" style={style}>
      <CheckCircle2 size={iconSize} strokeWidth={1.75} aria-hidden="true" />
      <span>{text}</span>
    </div>
  );
}

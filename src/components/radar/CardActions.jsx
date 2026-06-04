// Track-R R-1 — ProposalCard actions. "Review & send" opens the EXISTING draft
// in the composer (?draft=<id>) so the admin sends the proposal the cron
// drafted — no new comms_message, closing the draft+sent race (spec §4).
// Literal one-tap send (no review step) lands in the next slice once the send
// pipeline is callable headless. Buttons are 44px; disabled-on-busy.

import { Eye, X } from 'lucide-react';

const row = { display: 'flex', gap: 8, marginTop: 4 };
const btn = { minHeight: 44, borderRadius: 10, fontSize: 14, fontWeight: 600, fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer' };
const primary = { ...btn, flex: 1, border: 'none', backgroundColor: 'var(--as-accent)', color: 'var(--as-text-inverse)' };
const ghost = { ...btn, padding: '0 14px', backgroundColor: 'transparent', color: 'var(--as-text-secondary)', border: '1px solid var(--as-border-default)' };

export default function CardActions({ onReview, onDismiss, busy = false }) {
  return (
    <div style={row}>
      <button type="button" className="as-press" style={{ ...primary, opacity: busy ? 0.5 : 1 }} disabled={busy} onClick={onReview}>
        <Eye size={16} strokeWidth={1.75} aria-hidden="true" /> Review &amp; send
      </button>
      <button type="button" className="as-press" style={{ ...ghost, opacity: busy ? 0.5 : 1 }} disabled={busy} onClick={onDismiss} aria-label="Dismiss this briefing">
        <X size={16} strokeWidth={1.75} aria-hidden="true" /> Dismiss
      </button>
    </div>
  );
}

// Wave 3.8 §5.2 — three-option choice dialog for editing a recurring
// event. Replaces the prior 2-option ConfirmDialog ("This one only" /
// "All future") that ambiguously mixed date/time intent with metadata
// intent. The new wording maps 1:1 to recurrence_scope values:
//
//   "Move this single instance"  → 'instance'
//   "Move this and future"       → 'this_and_future'
//   "Move entire series"         → 'series'
//
// Caller passes onChoose(scope) and onCancel().

import { createPortal } from 'react-dom';

const overlay = { position: 'fixed', inset: 0, zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' };
const sheet = { backgroundColor: 'var(--em-bg-card)', width: '100%', maxWidth: 520, borderRadius: '16px 16px 0 0', padding: 16, paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))' };
const btnRow = { display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 };
const btnBase = { width: '100%', minHeight: 48, borderRadius: 10, fontSize: 15, fontWeight: 600, fontFamily: 'inherit', textAlign: 'left', padding: '0 14px', cursor: 'pointer', border: '1px solid var(--em-border-default)', backgroundColor: 'var(--em-bg-secondary)', color: 'var(--em-text-primary)' };
const btnCancel = { ...btnBase, backgroundColor: 'transparent', color: 'var(--em-text-tertiary)', border: 'none', minHeight: 44 };

export default function ScopeChoiceDialog({ onChoose, onCancel }) {
  return createPortal(
    <div style={overlay} role="dialog" aria-modal="true" onClick={onCancel}>
      <div style={sheet} onClick={(e) => e.stopPropagation()}>
        <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--em-text-primary)', marginBottom: 4 }}>Edit recurring event</div>
        <div style={{ fontSize: 13, color: 'var(--em-text-secondary)' }}>Pick how the change applies.</div>
        <div style={btnRow}>
          <button type="button" className="sf-press" style={btnBase} onClick={() => onChoose('instance')}>
            Move this single instance
          </button>
          <button type="button" className="sf-press" style={btnBase} onClick={() => onChoose('this_and_future')}>
            Move this and future
          </button>
          <button type="button" className="sf-press" style={btnBase} onClick={() => onChoose('series')}>
            Move entire series
          </button>
          <button type="button" className="sf-press" style={btnCancel} onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>,
    document.body
  );
}

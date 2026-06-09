import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import BottomSheet from '../shared/BottomSheet';
import Input from '../shared/Input';

// Focused, anchored typed-confirm for the FORK E go-live cutover (clearing the
// pilot test redirect → real email to families). Per the architect's D3
// constraint, the highest-consequence action in the app gets a distinct dialog
// that cannot scroll out of view or fire on a stray tap — NOT an inline button.
// BottomSheet supplies role=dialog + aria-modal + focus trap + Esc + rgba(0,0,0,0.3)
// scrim. ConfirmBody is a BottomSheet child, so it remounts (typed text resets)
// on every open.

const CONFIRM_PHRASE = 'SEND LIVE';
const H = { display: 'flex', alignItems: 'center', gap: 8, fontSize: 17, fontWeight: 700, color: 'var(--as-text-primary)', margin: '4px 0 8px', letterSpacing: '-0.01em' };
const P = { fontSize: 13, color: 'var(--as-text-secondary)', lineHeight: 1.5, marginBottom: 8 };
const ACTS = { display: 'flex', gap: 10, marginTop: 14 };
const BTN = { flex: 1, minHeight: 48, borderRadius: 11, fontSize: 15, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', border: 'none' };

export default function GoLiveConfirmSheet({ open, onClose, onConfirm, saving }) {
  return (
    <BottomSheet open={open} onClose={onClose} initialHeight="55%" expandedHeight="80%">
      <ConfirmBody onClose={onClose} onConfirm={onConfirm} saving={saving} />
    </BottomSheet>
  );
}

function ConfirmBody({ onClose, onConfirm, saving }) {
  const [confirm, setConfirm] = useState('');
  const matched = confirm.trim() === CONFIRM_PHRASE;
  return (
    <div>
      <h3 style={H}>
        <AlertTriangle size={20} strokeWidth={2} style={{ color: 'var(--as-danger)', flexShrink: 0 }} aria-hidden="true" />
        Send live to families?
      </h3>
      <p style={P}>This removes the test redirect. The next send reaches <strong>real parents</strong>, not the pilot inbox. It can&rsquo;t be undone for messages already sent.</p>
      <Input
        label={`Type "${CONFIRM_PHRASE}" to confirm`}
        value={confirm}
        style={{ fontSize: 16, letterSpacing: '0.08em' }}
        onChange={(e) => setConfirm(e.target.value)}
        placeholder={CONFIRM_PHRASE}
      />
      <div style={ACTS}>
        <button type="button" className="as-press" style={{ ...BTN, backgroundColor: 'var(--as-bg-secondary)', color: 'var(--as-text-primary)' }} onClick={onClose}>
          Cancel
        </button>
        <button
          type="button"
          className="as-press"
          disabled={saving || !matched}
          onClick={() => { if (matched) onConfirm(); }}
          style={{ ...BTN, backgroundColor: 'var(--as-danger)', color: 'var(--as-text-inverse)', opacity: (saving || !matched) ? 0.5 : 1 }}
        >
          {saving ? 'Sending…' : 'Send live'}
        </button>
      </div>
    </div>
  );
}

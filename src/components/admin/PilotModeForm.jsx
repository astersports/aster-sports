import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import FullScreenForm from '../shared/FullScreenForm';
import Toggle from '../shared/Toggle';
import Input from '../shared/Input';

// Settings → Pilot → Pilot mode. GUARDED. pilot_mode_enabled + test recipient
// are bucket-A (organization_settings). Clearing pilot_test_recipient_email is the
// FORK E / D-4 go-live cutover — real email to families — so it is gated behind a
// typed "SEND LIVE" confirm + caution. This form builds the control; it does NOT
// perform the cutover (the operator fires it after SEND/LEGAL/SEE/RECOVER are green).
// Pessimistic save-and-close.

const CONFIRM_PHRASE = 'SEND LIVE';
const WRAP = { display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 600, margin: '0 auto' };
const CARD = { backgroundColor: 'var(--as-bg-card)', border: '1px solid var(--as-border-default)', borderRadius: 10, boxShadow: 'var(--as-shadow-sm)', padding: '4px 12px' };
const HELP = { fontSize: 13, color: 'var(--as-text-tertiary)', lineHeight: 1.4, margin: '0 4px' };
const CAUTION = { border: '1px solid var(--as-warning)', backgroundColor: 'var(--as-warning-soft)', borderRadius: 10, padding: 12, display: 'flex', flexDirection: 'column', gap: 8 };
const CAUTION_HEAD = { display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 600, color: 'var(--as-warning)' };
const CAUTION_BODY = { fontSize: 13, color: 'var(--as-text-secondary)', lineHeight: 1.45 };
const SAVE = { minHeight: 44, borderRadius: 10, color: 'var(--as-text-inverse)', fontSize: 15 };

export default function PilotModeForm({ open, onClose, initial, onSave, saving }) {
  return (
    <FullScreenForm open={open} onClose={onClose} title="Pilot mode">
      <Body initial={initial} onSave={onSave} saving={saving} onClose={onClose} />
    </FullScreenForm>
  );
}

function Body({ initial, onSave, saving, onClose }) {
  const [pilotEnabled, setPilotEnabled] = useState(initial.pilotEnabled !== false);
  const [email, setEmail] = useState(initial.testRecipientEmail || '');
  const [confirm, setConfirm] = useState('');

  // Cutover = clearing a previously-set test address → real email to families.
  const clearingEmail = !!initial.testRecipientEmail && !email.trim();
  const cutoverConfirmed = confirm.trim() === CONFIRM_PHRASE;
  const canSave = !clearingEmail || cutoverConfirmed;

  const submit = async () => {
    if (!canSave) return;
    const res = await onSave({
      pilot_mode_enabled: pilotEnabled,
      pilot_test_recipient_email: email.trim() || null,
    });
    if (res?.ok) onClose();
  };

  return (
    <div style={WRAP}>
      <div style={CARD}>
        <Toggle
          label="Pilot mode"
          description="Redirect every outbound message to the test address below instead of sending to families."
          checked={pilotEnabled}
          onChange={setPilotEnabled}
        />
      </div>
      <Input label="Test recipient email" type="email" value={email} style={{ fontSize: 16 }}
        onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
      <p style={HELP}>While a test address is set, every automated message routes here — families receive nothing.</p>

      {clearingEmail && (
        <div style={CAUTION}>
          <div style={CAUTION_HEAD}><AlertTriangle size={16} strokeWidth={2} aria-hidden="true" /> Go-live cutover</div>
          <p style={CAUTION_BODY}>
            Clearing the test address sends real email to families. Only do this after SEND, LEGAL,
            SEE, and RECOVER are green. Type <b>{CONFIRM_PHRASE}</b> below to confirm.
          </p>
          <Input label={`Type "${CONFIRM_PHRASE}" to confirm`} value={confirm} style={{ fontSize: 16 }}
            onChange={(e) => setConfirm(e.target.value)} placeholder={CONFIRM_PHRASE} />
        </div>
      )}

      <button type="button" onClick={submit} disabled={saving || !canSave}
        className="w-full font-semibold as-press as-bounce-tap"
        style={{ ...SAVE, opacity: (saving || !canSave) ? 0.6 : 1, backgroundColor: clearingEmail ? 'var(--as-danger)' : 'var(--as-accent)' }}>
        {saving ? 'Saving…' : (clearingEmail ? 'Send live' : 'Save')}
      </button>
    </div>
  );
}

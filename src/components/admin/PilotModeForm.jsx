import { useState } from 'react';
import { AlertTriangle, Lock } from 'lucide-react';
import FullScreenForm from '../shared/FullScreenForm';
import Toggle from '../shared/Toggle';
import Input from '../shared/Input';
import GoLiveConfirmSheet from './GoLiveConfirmSheet';
import { useAuth } from '../../context/AuthContext';
import { reportAudit } from '../../lib/reportError';

// Settings → Pilot → Pilot mode. pilot_mode_enabled + test recipient are bucket-A.
// Normal Save edits the toggle / a non-empty test address. The go-live CUTOVER
// (clearing pilot_test_recipient_email → real email to families, FORK E / D-4) is
// reachable ONLY through the focused GoLiveConfirmSheet behind a typed SEND-LIVE
// confirm (architect D3 constraint — it can't scroll out of view or fire on a
// stray tap). This form builds the control; the operator fires the cutover after
// SEND/LEGAL/SEE/RECOVER are green.
//
// Operator directive 2026-06-09: REMAINING ON PILOT IS MANDATORY. The go-live
// cutover is locked off in the app via CUTOVER_ENABLED=false — there is no UI path
// to clear pilot_test_recipient_email, so all outbound email stays redirected. The
// cutover machinery (the focused SEND-LIVE confirm + the E6 cutover audit) is
// PRESERVED behind the flag; flip to true to re-enable once LEGAL is resolved (a
// CAN-SPAM footer address). A hard server-side lock is available as architect-lane work.
const CUTOVER_ENABLED = false;

const WRAP = { display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 600, margin: '0 auto' };
const CARD = { backgroundColor: 'var(--as-bg-card)', border: '1px solid var(--as-border-default)', borderRadius: 10, boxShadow: 'var(--as-shadow-sm)', padding: '4px 12px' };
const HELP = { fontSize: 13, color: 'var(--as-text-tertiary)', lineHeight: 1.4, margin: '0 4px' };
const SAVE = { minHeight: 44, borderRadius: 10, backgroundColor: 'var(--as-accent)', color: 'var(--as-text-inverse)', fontSize: 15 };
const DANGER_CARD = { border: '1px solid var(--as-danger)', backgroundColor: 'var(--as-danger-soft)', borderRadius: 10, padding: 14, display: 'flex', flexDirection: 'column', gap: 8 };
const DANGER_HEAD = { display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em', color: 'var(--as-danger)' };
const DANGER_BODY = { fontSize: 13, color: 'var(--as-text-secondary)', lineHeight: 1.45 };
const DANGER_BTN = { minHeight: 44, borderRadius: 10, border: '1px solid var(--as-danger)', backgroundColor: 'var(--as-bg-card)', color: 'var(--as-danger)', fontSize: 14, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' };
const LOCK_CARD = { border: '1px solid var(--as-border-default)', backgroundColor: 'var(--as-bg-secondary)', borderRadius: 10, padding: 14, display: 'flex', alignItems: 'flex-start', gap: 8 };
const LOCK_BODY = { fontSize: 13, color: 'var(--as-text-secondary)', lineHeight: 1.45 };

export default function PilotModeForm({ open, onClose, initial, onSave, saving }) {
  return (
    <FullScreenForm open={open} onClose={onClose} title="Pilot mode">
      <Body initial={initial} onSave={onSave} saving={saving} onClose={onClose} />
    </FullScreenForm>
  );
}

function Body({ initial, onSave, saving, onClose }) {
  const { user, orgId } = useAuth();
  const [pilotEnabled, setPilotEnabled] = useState(initial.pilotEnabled !== false);
  const [email, setEmail] = useState(initial.testRecipientEmail || '');
  const [confirmOpen, setConfirmOpen] = useState(false);

  const canSave = !!email.trim();
  const saveSettings = async () => {
    if (!canSave) return;
    const res = await onSave({ pilot_mode_enabled: pilotEnabled, pilot_test_recipient_email: email.trim() });
    if (res?.ok) onClose();
  };
  const goLive = async () => {
    const res = await onSave({ pilot_mode_enabled: pilotEnabled, pilot_test_recipient_email: null });
    if (res?.ok) {
      // E6 (architect): durable actor+timestamp trail for the cutover — the single
      // most consequential action in the app. (Interim: Sentry/console; a proper DB
      // audit on pii_audit_log needs an architect-lane insert path.)
      reportAudit('pilot_cutover', { actorId: user?.id ?? null, orgId: orgId ?? null, clearedAddress: initial.testRecipientEmail ?? null });
      setConfirmOpen(false);
      onClose();
    }
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
      <button type="button" onClick={saveSettings} disabled={saving || !canSave}
        className="w-full font-semibold as-press as-bounce-tap" style={{ ...SAVE, opacity: (saving || !canSave) ? 0.6 : 1 }}>
        {saving ? 'Saving…' : 'Save'}
      </button>

      {CUTOVER_ENABLED ? (
        <>
          {!!initial.testRecipientEmail && (
            <div style={DANGER_CARD}>
              <div style={DANGER_HEAD}><AlertTriangle size={15} strokeWidth={2} aria-hidden="true" /> Go live</div>
              <p style={DANGER_BODY}>Clearing the test address sends real email to families. Only after SEND, LEGAL, SEE, and RECOVER are green.</p>
              <button type="button" className="as-press" style={DANGER_BTN} onClick={() => setConfirmOpen(true)}>
                Go live to families…
              </button>
            </div>
          )}
          <GoLiveConfirmSheet open={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={goLive} saving={saving} />
        </>
      ) : (
        <div style={LOCK_CARD}>
          <Lock size={15} strokeWidth={2} aria-hidden="true" style={{ color: 'var(--as-text-tertiary)', flexShrink: 0, marginTop: 1 }} />
          <p style={LOCK_BODY}>Pilot mode is required — going live is disabled. All outbound email stays redirected to the test address.</p>
        </div>
      )}
    </div>
  );
}

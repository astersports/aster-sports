import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useAuth } from '../../context/AuthContext';
import ModalBackground from '../shared/ModalBackground';
import { ADMIN_BCC_EMAIL } from '../../lib/briefings/queueComposedMessagesBuilders';

const baseBtnStyle = {
  flex: 1, minHeight: 44, borderRadius: 10, fontSize: 15, fontWeight: 600,
  border: 'none', fontFamily: 'inherit', cursor: 'pointer',
};

// Confirms a tournament-briefing send. Owns the "Send to me only (test)"
// toggle. Computes the effective recipient list and hands it to onConfirm.
// Displays inline result/error states; stays open during the send so the
// caller doesn't need to manage a separate result toast.
export default function SendConfirmDialog({
  open, onClose, onConfirm,
  sending, result, error,
  recipients = [],
  tournamentName, teamName, messageTypeLabel,
}) {
  const { user } = useAuth();
  const adminEmail = user?.email;
  const trapRef = useFocusTrap(open);
  const [testSendOnly, setTestSendOnly] = useState(false);

  useEffect(() => {
    if (!open) {
      Promise.resolve().then(() => setTestSendOnly(false));
      return undefined;
    }
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape' && !sending) onClose(); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey); };
  }, [open, sending, onClose]);

  if (!open) return null;
  const showResult = result || error;
  const effective = testSendOnly
    ? (adminEmail ? [{ guardian_id: 'test', email: adminEmail, name: 'Me (test)', children: [] }] : [])
    : recipients;
  // Family count excludes the admin BCC audit copy. Test mode is always
  // a single send to the operator. Real send: families + 1 admin BCC,
  // but the count shown to the operator is the family count.
  const familyCount = testSendOnly ? 0 : effective.filter((r) => !r.is_admin_copy).length;
  const count = effective.length;
  const canSend = count > 0 && !sending && !showResult;

  return createPortal(
    <ModalBackground onClick={() => { if (!sending) onClose(); }} zIndex={9998}>
      <div
        ref={trapRef}
        className="as-fade-in"
        onClick={(e) => e.stopPropagation()}
        role="dialog" aria-modal="true" aria-labelledby="send-confirm-title"
        style={{
          backgroundColor: 'var(--as-bg-card)', borderRadius: 16, padding: 24,
          width: '100%', maxWidth: 440, margin: 16, boxShadow: 'var(--as-shadow-lg)',
        }}
      >
        <h2 id="send-confirm-title" style={{ fontSize: 18, fontWeight: 600, color: 'var(--as-text-primary)', marginBottom: 12 }}>
          {showResult ? (error ? 'Send failed' : 'Sent') : (testSendOnly ? 'Send test to yourself?' : `Send to ${familyCount} ${familyCount === 1 ? 'family' : 'families'} on ${teamName || 'this team'}?`)}
        </h2>

        {!showResult && (
          <>
            <div style={{ fontSize: 14, color: 'var(--as-text-secondary)', lineHeight: 1.6, marginBottom: 16 }}>
              <div><strong style={{ color: 'var(--as-text-primary)' }}>Tournament:</strong> {tournamentName}</div>
              <div><strong style={{ color: 'var(--as-text-primary)' }}>Team:</strong> {teamName}</div>
              <div><strong style={{ color: 'var(--as-text-primary)' }}>Type:</strong> {messageTypeLabel}</div>
            </div>
            <label className="flex items-start gap-2" style={{ padding: 12, borderRadius: 10, backgroundColor: 'var(--as-info-soft)', border: '1px solid var(--as-info)', cursor: 'pointer' }}>
              <input
                type="checkbox" checked={testSendOnly}
                onChange={(e) => setTestSendOnly(e.target.checked)}
                style={{ width: 18, height: 18, marginTop: 2, cursor: 'pointer' }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--as-text-primary)' }}>Send to me only (test)</div>
                <div style={{ fontSize: 12, color: 'var(--as-text-secondary)', marginTop: 2 }}>
                  {testSendOnly ? `Only ${adminEmail ?? 'you'} will receive this.` : 'Override the recipient list — useful for a smoke test before the real send.'}
                </div>
              </div>
            </label>
            {!testSendOnly && effective.some((r) => r.is_admin_copy) && (
              <div style={{ fontSize: 12, color: 'var(--as-text-tertiary)', marginTop: 8, textAlign: 'center' }}>
                {ADMIN_BCC_EMAIL} also receives a BCC audit copy.
              </div>
            )}
          </>
        )}

        {result && (
          <div style={{ padding: 12, borderRadius: 10, fontSize: 14, backgroundColor: 'var(--as-success-soft)', color: 'var(--as-text-primary)' }}>
            Sent {result.sent ?? 0} · Failed {result.failed ?? 0}
          </div>
        )}
        {error && (
          <div style={{ padding: 12, borderRadius: 10, fontSize: 14, backgroundColor: 'var(--as-danger-soft)', color: 'var(--as-text-primary)' }}>
            Looks like that didn&rsquo;t go through. {error.message || 'Try again in a moment.'}
          </div>
        )}

        <div className="flex gap-2" style={{ marginTop: 20 }}>
          {showResult ? (
            <button type="button" onClick={onClose}
              style={{ ...baseBtnStyle, backgroundColor: 'var(--as-accent)', color: 'var(--as-text-inverse)' }}>
              Done
            </button>
          ) : (
            <>
              <button type="button" onClick={onClose} disabled={sending}
                style={{ ...baseBtnStyle, backgroundColor: 'var(--as-bg-secondary)', color: 'var(--as-text-primary)', opacity: sending ? 0.5 : 1 }}>
                Cancel
              </button>
              <button type="button" onClick={() => onConfirm(effective, testSendOnly)} disabled={!canSend} autoFocus
                style={{ ...baseBtnStyle, backgroundColor: 'var(--as-accent)', color: 'var(--as-text-inverse)', opacity: canSend ? 1 : 0.6 }}>
                {sending ? 'Sending…' : 'Send'}
              </button>
            </>
          )}
        </div>
      </div>
    </ModalBackground>,
    document.body,
  );
}

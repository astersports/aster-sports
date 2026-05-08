import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useFocusTrap } from '../../hooks/useFocusTrap';

const baseBtnStyle = {
  flex: 1,
  minHeight: 44,
  borderRadius: 10,
  fontSize: 15,
  fontWeight: 600,
  border: 'none',
  fontFamily: 'inherit',
  cursor: 'pointer',
};

export default function SendConfirmDialog({
  open, onClose, onConfirm, sending, result, error,
  tournamentName, teamName, subject, recipientCount, messageTypeLabel, isTestSend,
}) {
  const trapRef = useFocusTrap(open);

  useEffect(() => {
    if (!open) return undefined;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape' && !sending) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey); };
  }, [open, sending, onClose]);

  if (!open) return null;

  const showResult = result || error;

  return createPortal(
    <div
      ref={trapRef}
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.3)', zIndex: 9998 }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="send-confirm-title"
      onClick={() => { if (!sending) onClose(); }}
    >
      <div
        className="sf-fade-in"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--em-bg-card)',
          borderRadius: 16,
          padding: 24,
          width: '100%',
          maxWidth: 440,
          boxShadow: 'var(--em-shadow-lg)',
        }}
      >
        <h2 id="send-confirm-title" style={{ fontSize: 18, fontWeight: 600, color: 'var(--em-text-primary)', marginBottom: 12 }}>
          {showResult ? (error ? 'Send failed' : 'Sent') : (isTestSend ? 'Send test to yourself?' : `Send to ${recipientCount} ${recipientCount === 1 ? 'family' : 'families'}?`)}
        </h2>

        {!showResult && (
          <div style={{ fontSize: 14, color: 'var(--em-text-secondary)', lineHeight: 1.6 }}>
            <div><strong style={{ color: 'var(--em-text-primary)' }}>Tournament:</strong> {tournamentName}</div>
            <div><strong style={{ color: 'var(--em-text-primary)' }}>Team:</strong> {teamName}</div>
            <div><strong style={{ color: 'var(--em-text-primary)' }}>Type:</strong> {messageTypeLabel}</div>
            <div style={{ wordBreak: 'break-word' }}><strong style={{ color: 'var(--em-text-primary)' }}>Subject:</strong> {subject}</div>
          </div>
        )}

        {result && (
          <div style={{
            padding: 12, borderRadius: 10, fontSize: 14,
            backgroundColor: 'var(--em-success-soft)', color: 'var(--em-text-primary)',
          }}>
            Sent {result.sent ?? 0} · Failed {result.failed ?? 0}
          </div>
        )}
        {error && (
          <div style={{
            padding: 12, borderRadius: 10, fontSize: 14,
            backgroundColor: 'var(--em-danger-soft)', color: 'var(--em-text-primary)',
          }}>
            Looks like that didn&rsquo;t go through. {error.message || 'Try again in a moment.'}
          </div>
        )}

        <div className="flex gap-2" style={{ marginTop: 20 }}>
          {showResult ? (
            <button
              type="button"
              onClick={onClose}
              style={{ ...baseBtnStyle, backgroundColor: 'var(--em-accent)', color: 'var(--em-text-inverse)' }}
            >
              Done
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                disabled={sending}
                style={{
                  ...baseBtnStyle,
                  backgroundColor: 'var(--em-bg-secondary)',
                  color: 'var(--em-text-primary)',
                  opacity: sending ? 0.5 : 1,
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={sending}
                autoFocus
                style={{
                  ...baseBtnStyle,
                  backgroundColor: 'var(--em-accent)',
                  color: 'var(--em-text-inverse)',
                  opacity: sending ? 0.7 : 1,
                }}
              >
                {sending ? 'Sending…' : 'Send'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

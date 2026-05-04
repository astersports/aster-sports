import { useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') onCancel?.(); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey); };
  }, [onCancel]);

  const confirmBg = destructive ? 'var(--em-danger)' : 'var(--em-accent)';

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.3)', zIndex: 9998 }}
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
    >
      <div
        className="sf-fade-in"
        style={{
          backgroundColor: 'var(--em-bg-card)',
          borderRadius: 16,
          padding: 20,
          width: '100%',
          maxWidth: 360,
          boxShadow: 'var(--em-shadow-lg)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <h2 id="confirm-title" className="font-semibold"
            style={{ color: 'var(--em-text-primary)', fontSize: 17, marginBottom: 8 }}>{title}</h2>
        )}
        {message && (
          <p style={{ color: 'var(--em-text-secondary)', fontSize: 14, lineHeight: 1.5 }}>{message}</p>
        )}
        <div className="flex gap-2 mt-5">
          <button type="button" onClick={onCancel} className="flex-1 font-medium sf-press"
            style={{ minHeight: 44, borderRadius: 10, backgroundColor: 'var(--em-bg-secondary)', color: 'var(--em-text-primary)', fontSize: 15, border: 'none' }}>
            {cancelLabel}
          </button>
          <button type="button" onClick={onConfirm} className="flex-1 font-semibold sf-press"
            style={{ minHeight: 44, borderRadius: 10, backgroundColor: confirmBg, color: 'var(--em-text-inverse)', fontSize: 15, border: 'none' }}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

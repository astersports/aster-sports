import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import ModalBackground from './ModalBackground';

export default function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel,
}) {
  const trapRef = useFocusTrap(true);
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape') onCancel?.();
      else if (e.key === 'Enter') onConfirm?.();
    };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey); };
  }, [onCancel, onConfirm]);

  const confirmBg = destructive ? 'var(--as-danger)' : 'var(--as-accent)';

  return createPortal(
    <ModalBackground onClick={onCancel} zIndex={9998}>
      <div
        ref={trapRef}
        className="as-fade-in"
        style={{
          backgroundColor: 'var(--as-bg-card)',
          borderRadius: 16,
          padding: 20,
          width: '100%',
          maxWidth: 360,
          margin: 16,
          boxShadow: 'var(--as-shadow-lg)',
        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
      >
        {title && (
          <h2 id="confirm-title" className="font-semibold"
            style={{ color: 'var(--as-text-primary)', fontSize: 17, marginBottom: 8 }}>{title}</h2>
        )}
        {message && (
          <p style={{ color: 'var(--as-text-secondary)', fontSize: 14, lineHeight: 1.5 }}>{message}</p>
        )}
        <div className="flex gap-2 mt-5">
          <button type="button" onClick={onCancel} className="flex-1 font-medium as-press"
            style={{ minHeight: 44, borderRadius: 10, backgroundColor: 'var(--as-bg-secondary)', color: 'var(--as-text-primary)', fontSize: 15, border: 'none' }}>
            {cancelLabel}
          </button>
          <button type="button" onClick={onConfirm} autoFocus className="flex-1 font-semibold as-press"
            style={{ minHeight: 44, borderRadius: 10, backgroundColor: confirmBg, color: 'var(--as-text-inverse)', fontSize: 15, border: 'none' }}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </ModalBackground>,
    document.body
  );
}

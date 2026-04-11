import { useEffect } from 'react';

// Blocking confirm modal. Used for destructive actions (delete, cancel,
// revoke) where we want a deliberate second tap before we commit.
// `destructive` swaps the confirm button to the danger color — the default
// is the regular accent for benign confirms.
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onCancel?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  if (!open) return null;

  const confirmBg = destructive ? 'var(--sf-danger)' : 'var(--sf-accent)';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
    >
      <div
        className="sf-fade-in"
        style={{
          backgroundColor: 'var(--sf-bg-card)',
          borderRadius: 14,
          padding: 20,
          width: '100%',
          maxWidth: 360,
          boxShadow: 'var(--sf-shadow-lg)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <h2
            id="confirm-title"
            className="font-semibold"
            style={{ color: 'var(--sf-text-primary)', fontSize: 17, marginBottom: 8 }}
          >
            {title}
          </h2>
        )}
        {message && (
          <p style={{ color: 'var(--sf-text-secondary)', fontSize: 14, lineHeight: 1.5 }}>
            {message}
          </p>
        )}
        <div className="flex gap-2 mt-5">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 font-medium sf-press"
            style={{
              minHeight: 44,
              borderRadius: 10,
              backgroundColor: 'var(--sf-bg-secondary)',
              color: 'var(--sf-text-primary)',
              fontSize: 15,
            }}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 font-semibold sf-press"
            style={{
              minHeight: 44,
              borderRadius: 10,
              backgroundColor: confirmBg,
              color: 'var(--sf-text-inverse)',
              fontSize: 15,
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

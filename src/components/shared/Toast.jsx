import { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

// One-off toast notification. Renders nothing if `message` is falsy so
// parents can keep the component mounted and toggle it via a single
// `setToast(null)` call.
const VARIANT_META = {
  success: { icon: CheckCircle2, bg: 'var(--em-success)',  fg: 'var(--em-text-inverse)' },
  error:   { icon: AlertCircle,  bg: 'var(--em-danger)',   fg: 'var(--em-text-inverse)' },
  info:    { icon: Info,         bg: 'var(--em-info)',     fg: 'var(--em-text-inverse)' },
};

export default function Toast({ message, variant = 'info', onDismiss, duration = 3000 }) {
  useEffect(() => {
    if (!message) return;
    const id = setTimeout(() => onDismiss?.(), duration);
    return () => clearTimeout(id);
  }, [message, duration, onDismiss]);

  if (!message) return null;
  const meta = VARIANT_META[variant] || VARIANT_META.info;
  const Icon = meta.icon;

  return (
    <div
      className="fixed z-50 sf-toast-enter flex items-center gap-2"
      role="status"
      aria-live="polite"
      style={{
        bottom: 96, // clears bottom nav
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: meta.bg,
        color: meta.fg,
        padding: '12px 16px',
        borderRadius: 10,
        boxShadow: 'var(--em-shadow-lg)',
        maxWidth: 'calc(100% - 32px)',
        fontSize: 14,
        fontWeight: 500,
      }}
    >
      <Icon size={20} strokeWidth={2} aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}

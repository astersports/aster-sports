import { useEffect, useRef } from 'react';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';

const VARIANT_META = {
  success: { icon: CheckCircle2, bg: 'var(--as-success)',  fg: 'var(--as-text-inverse)' },
  error:   { icon: AlertCircle,  bg: 'var(--as-danger)',   fg: 'var(--as-text-inverse)' },
  info:    { icon: Info,         bg: 'var(--as-info)',     fg: 'var(--as-text-inverse)' },
};

export default function Toast({ message, variant = 'info', onDismiss, duration = 3000 }) {
  const onDismissRef = useRef(onDismiss);
  useEffect(() => { onDismissRef.current = onDismiss; });
  useEffect(() => {
    if (!message) return;
    const id = setTimeout(() => onDismissRef.current?.(), duration);
    return () => clearTimeout(id);
  }, [message, duration]);

  if (!message) return null;
  const meta = VARIANT_META[variant] || VARIANT_META.info;
  const Icon = meta.icon;

  return (
    <div
      className="fixed z-50 as-toast-enter flex items-center gap-2"
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
        boxShadow: 'var(--as-shadow-lg)',
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

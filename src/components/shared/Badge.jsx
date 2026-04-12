// Small status pill used for RSVP state, event status, role tags, etc.
// Variants map to the Skyfire status tokens — "soft" bg + solid text —
// which keeps contrast readable in both light and dark surfaces.

const VARIANTS = {
  success: { bg: 'var(--sf-success-soft)', fg: 'var(--sf-success)' },
  warning: { bg: 'var(--sf-warning-soft)', fg: 'var(--sf-warning)' },
  danger:  { bg: 'var(--sf-danger-soft)',  fg: 'var(--sf-danger)'  },
  info:    { bg: 'var(--sf-info-soft)',    fg: 'var(--sf-info)'    },
  neutral: { bg: 'var(--sf-neutral-soft)', fg: 'var(--sf-neutral)' },
  academy: { bg: 'var(--sf-academy-soft)', fg: 'var(--sf-academy)' },
};

export default function Badge({ children, variant = 'neutral', className = '' }) {
  const v = VARIANTS[variant] || VARIANTS.neutral;
  return (
    <span
      className={`inline-flex items-center font-medium ${className}`}
      style={{
        backgroundColor: v.bg,
        color: v.fg,
        borderRadius: 6,
        fontSize: 11,
        lineHeight: 1,
        padding: '4px 8px',
        letterSpacing: 0.2,
      }}
    >
      {children}
    </span>
  );
}

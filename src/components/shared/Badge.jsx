// Small status pill used for RSVP state, event status, role tags, etc.
// Variants map to the Skyfire status tokens — "soft" bg + solid text —
// which keeps contrast readable in both light and dark surfaces.

const VARIANTS = {
  success: { bg: 'var(--em-success-soft)', fg: 'var(--em-success)' },
  warning: { bg: 'var(--em-warning-soft)', fg: 'var(--em-warning)' },
  danger:  { bg: 'var(--em-danger-soft)',  fg: 'var(--em-danger)'  },
  info:    { bg: 'var(--em-info-soft)',    fg: 'var(--em-info)'    },
  neutral: { bg: 'var(--em-neutral-soft)', fg: 'var(--em-neutral)' },
  academy: { bg: 'var(--em-academy-soft)', fg: 'var(--em-academy)' },
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

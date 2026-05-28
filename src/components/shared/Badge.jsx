// Small status pill used for RSVP state, event status, role tags, etc.
// Variants map to the Ember status tokens — "soft" bg + solid text —
// which keeps contrast readable in both light and dark surfaces.
//
// Two shapes:
//   default       — rectangular badge (borderRadius 6, per CLAUDE.md §7).
//   pill={true}   — pill shape (borderRadius 999). The pill mode was added
//                   per L99 platform audit P2.5 D1 to consolidate ~10 inline
//                   pill-shaped <span>s scattered across schedule/inbox/admin
//                   surfaces. Default base typography matches the dominant
//                   inline pattern observed: fontSize 11, weight 600,
//                   padding 2px 8px. `compact` shrinks for dense rows.
//
// Pill mode adds two extra variants beyond the rectangular palette:
//   urgent — filled accent (high-emphasis count badges, e.g. inbox tab)
//   subtle — muted neutral pair (lower-emphasis counts)

const VARIANTS = {
  success: { bg: 'var(--em-success-soft)', fg: 'var(--em-success)' },
  warning: { bg: 'var(--em-warning-soft)', fg: 'var(--em-warning)' },
  danger:  { bg: 'var(--em-danger-soft)',  fg: 'var(--em-danger)'  },
  info:    { bg: 'var(--em-info-soft)',    fg: 'var(--em-info)'    },
  neutral: { bg: 'var(--em-neutral-soft)', fg: 'var(--em-neutral)' },
  academy: { bg: 'var(--em-academy-soft)', fg: 'var(--em-academy)' },
  // Pill-mode-only variants below. Safe to use in rectangular mode too.
  accent:  { bg: 'var(--em-accent-soft)',  fg: 'var(--em-accent)'  },
  urgent:  { bg: 'var(--em-accent)',       fg: 'var(--em-text-inverse)' },
  subtle:  { bg: 'var(--em-bg-tertiary)',  fg: 'var(--em-text-tertiary)' },
};

export default function Badge({ children, variant = 'neutral', className = '', pill = false, compact = false, style }) {
  const v = VARIANTS[variant] || VARIANTS.neutral;
  if (pill) {
    return (
      <span
        className={`inline-flex items-center ${className}`}
        style={{
          backgroundColor: v.bg,
          color: v.fg,
          fontSize: compact ? 10 : 11,
          fontWeight: 600,
          padding: compact ? '1px 6px' : '2px 8px',
          lineHeight: 1,
          ...style,
          borderRadius: 999,
        }}
      >
        {children}
      </span>
    );
  }
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

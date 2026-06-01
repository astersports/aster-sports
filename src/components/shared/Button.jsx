const VARIANTS = {
  primary: {
    backgroundColor: 'var(--as-accent)',
    color: 'var(--as-text-inverse)',
    border: 'none',
  },
  secondary: {
    backgroundColor: 'transparent',
    color: 'var(--as-accent)',
    border: '1.5px solid var(--as-accent)',
  },
  danger: {
    backgroundColor: 'var(--as-danger)',
    color: 'var(--as-text-inverse)',
    border: 'none',
  },
  ghost: {
    backgroundColor: 'transparent',
    color: 'var(--as-text-secondary)',
    border: 'none',
  },
};

const SIZES = {
  sm: { minHeight: 44, fontSize: 13, padding: '0 12px', borderRadius: 10 },
  md: { minHeight: 44, fontSize: 15, padding: '0 16px', borderRadius: 10 },
  lg: { minHeight: 56, fontSize: 15, padding: '0 20px', borderRadius: 10 },
};

export default function Button({ children, variant = 'primary', size = 'md', fullWidth, disabled, style, ...props }) {
  const v = VARIANTS[variant] || VARIANTS.primary;
  const s = SIZES[size] || SIZES.md;
  return (
    <button
      type="button"
      className="as-press"
      disabled={disabled}
      style={{
        ...s,
        ...v,
        fontWeight: 600,
        fontFamily: 'inherit',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        width: fullWidth ? '100%' : undefined,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        ...style,
      }}
      {...props}
    >
      {children}
    </button>
  );
}

const VARIANTS = {
  primary: {
    backgroundColor: 'var(--em-accent)',
    color: 'var(--em-text-inverse)',
    border: 'none',
  },
  secondary: {
    backgroundColor: 'transparent',
    color: 'var(--em-accent)',
    border: '1.5px solid var(--em-accent)',
  },
  danger: {
    backgroundColor: 'var(--em-danger)',
    color: 'var(--em-text-inverse)',
    border: 'none',
  },
  ghost: {
    backgroundColor: 'transparent',
    color: 'var(--em-text-secondary)',
    border: 'none',
  },
};

const SIZES = {
  sm: { minHeight: 36, fontSize: 13, padding: '0 12px', borderRadius: 8 },
  md: { minHeight: 44, fontSize: 15, padding: '0 16px', borderRadius: 10 },
  lg: { minHeight: 56, fontSize: 15, padding: '0 20px', borderRadius: 10 },
};

export default function Button({ children, variant = 'primary', size = 'md', fullWidth, disabled, style, ...props }) {
  const v = VARIANTS[variant] || VARIANTS.primary;
  const s = SIZES[size] || SIZES.md;
  return (
    <button
      type="button"
      className="sf-press"
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

export default function Label({ children, style }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 500, letterSpacing: '0.05em',
      textTransform: 'uppercase', color: 'var(--as-text-tertiary)',
      marginBottom: 8, ...style,
    }}>{children}</div>
  );
}

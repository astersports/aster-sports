// Shared button styles for the registration wizard. Kept in a non-component module so
// fields.jsx stays component-only (react-refresh/only-export-components).
export const primaryBtn = {
  display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', minHeight: 44,
  borderRadius: 10, border: 'none', backgroundColor: 'var(--as-accent)', color: 'var(--as-text-inverse)',
  fontSize: 15, fontWeight: 600, cursor: 'pointer',
};
export const ghostBtn = {
  display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 44, padding: '0 16px',
  borderRadius: 10, border: '1px solid var(--as-border-default)', backgroundColor: 'var(--as-bg-card)',
  color: 'var(--as-text-secondary)', fontSize: 15, fontWeight: 500, cursor: 'pointer',
};

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

// Shared wizard layout (RegisterFlowPage + step phases).
export const centered = { padding: 32, textAlign: 'center', color: 'var(--as-text-tertiary)' };
export const wrap = { maxWidth: 600, margin: '0 auto', padding: '16px 16px 80px', backgroundColor: 'var(--as-bg-page)', minHeight: '100vh' };
export const linkBtn = { background: 'none', border: 'none', color: 'var(--as-accent)', fontSize: 15, cursor: 'pointer', padding: 0 };
export const metaStyle = { fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--as-text-tertiary)', margin: '8px 0 2px' };
export const h1Style = { fontSize: 20, fontWeight: 700, color: 'var(--as-text-primary)', margin: '0 0 4px' };
export const subStyle = { fontSize: 13, color: 'var(--as-text-tertiary)', margin: '0 0 16px' };

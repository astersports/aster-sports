// Reusable single-select filter-pill row for the no-login Hub (R1·PR-A). Long
// data lists scroll forever; pills let a parent narrow before scrolling. The row
// itself scrolls horizontally so it never wraps. Each option: { key, label,
// count? }. Active pill = gold fill. --as-* tokens only; 36px tap height.

export default function AauFilterPills({ options, value, onChange, ariaLabel }) {
  if (!Array.isArray(options) || options.length === 0) return null;
  return (
    <div
      role="group"
      aria-label={ariaLabel || 'Filters'}
      style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '4px 0', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
    >
      {options.map((o) => {
        const active = o.key === value;
        return (
          <button
            key={o.key}
            type="button"
            onClick={() => onChange(o.key)}
            aria-pressed={active}
            style={{
              flexShrink: 0, minHeight: 36, padding: '0 14px', fontSize: 13, fontWeight: 600,
              borderRadius: 9999, cursor: 'pointer', whiteSpace: 'nowrap',
              color: active ? 'var(--as-text-inverse)' : 'var(--as-text-secondary)',
              backgroundColor: active ? 'var(--as-accent)' : 'var(--as-bg-card)',
              border: `1px solid ${active ? 'var(--as-accent)' : 'var(--as-border-default)'}`,
            }}
          >
            {o.label}{o.count != null ? ` · ${o.count}` : ''}
          </button>
        );
      })}
    </div>
  );
}

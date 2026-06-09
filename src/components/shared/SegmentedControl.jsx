// Shared segmented control (radiogroup). options: [{ value, label }]. 44px tap
// targets per §7. Used by the settings forms (Appearance theme/density, etc.).
const WRAP = { display: 'flex', backgroundColor: 'var(--as-bg-secondary)', border: '1px solid var(--as-border-default)', borderRadius: 10, padding: 3, gap: 3 };
const OPT = { flex: 1, minHeight: 44, borderRadius: 8, border: 'none', background: 'none', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, color: 'var(--as-text-secondary)', cursor: 'pointer' };
const OPT_ON = { backgroundColor: 'var(--as-bg-card)', color: 'var(--as-accent)', boxShadow: 'var(--as-shadow-sm)' };

export default function SegmentedControl({ label, value, onChange, options }) {
  return (
    <div role="radiogroup" aria-label={label} style={WRAP}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={o.label}
            className="as-press"
            onClick={() => onChange(o.value)}
            style={on ? { ...OPT, ...OPT_ON } : OPT}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

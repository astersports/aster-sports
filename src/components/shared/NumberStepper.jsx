import { Minus, Plus } from 'lucide-react';

// Shared number stepper: label + optional description on the left, a
// −/value/+ control on the right. 44px tap targets per §7. `disabled`
// greys the whole row and blocks both buttons (used when a parent toggle
// is off — disabled-not-hidden per the A2 spec). aria-live announces the
// value to screen readers on change.
export default function NumberStepper({
  label, description, value, onChange, min = 1, max = 99, disabled = false,
}) {
  const atMin = disabled || value <= min;
  const atMax = disabled || value >= max;
  const dec = () => { if (!atMin) onChange(value - 1); };
  const inc = () => { if (!atMax) onChange(value + 1); };

  const btn = (off) => ({
    width: 44, height: 44, borderRadius: 10, flexShrink: 0,
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    border: '1px solid var(--as-border-default)',
    backgroundColor: 'var(--as-bg-card)',
    color: off ? 'var(--as-text-tertiary)' : 'var(--as-text-primary)',
    cursor: off ? 'default' : 'pointer',
  });

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      minHeight: 44, padding: '0 4px', opacity: disabled ? 0.5 : 1,
    }}>
      <div style={{ flex: 1, minWidth: 0, marginRight: 12 }}>
        <span style={{ fontSize: 15, color: 'var(--as-text-primary)', display: 'block' }}>{label}</span>
        {description && (
          <span style={{ fontSize: 13, color: 'var(--as-text-tertiary)', display: 'block', marginTop: 2, lineHeight: 1.4 }}>
            {description}
          </span>
        )}
      </div>
      <div role="group" aria-label={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button type="button" className="as-press" aria-label={`Decrease ${label}`}
          disabled={atMin} onClick={dec} style={btn(atMin)}>
          <Minus size={18} strokeWidth={1.75} aria-hidden="true" />
        </button>
        <span aria-live="polite" style={{ minWidth: 24, textAlign: 'center', fontSize: 17, fontWeight: 700, color: 'var(--as-text-primary)' }}>
          {value}
        </span>
        <button type="button" className="as-press" aria-label={`Increase ${label}`}
          disabled={atMax} onClick={inc} style={btn(atMax)}>
          <Plus size={18} strokeWidth={1.75} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

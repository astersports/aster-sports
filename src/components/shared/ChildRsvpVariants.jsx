import { Check, HelpCircle, X } from 'lucide-react';

// Presentational variants for ChildRsvp (logic stays in ChildRsvp.jsx).
// DESIGN SYSTEM D4: tri-state everywhere with fixed color semantics —
// going = GREEN, maybe = AMBER, can't = RED. Re-tap clears.

const OPTIONS = [
  { value: 'going', label: 'Going', Icon: Check, fill: 'var(--as-success)', soft: 'var(--as-success-soft)' },
  { value: 'maybe', label: 'Maybe', Icon: HelpCircle, fill: 'var(--as-warning)', soft: 'var(--as-warning-soft)' },
  { value: 'not_going', label: "Can't", Icon: X, fill: 'var(--as-danger)', soft: 'var(--as-danger-soft)' },
];

// DETAILED: three 44px buttons — the selected one FILLS its color;
// unselected Going keeps a green-tinted outline (the invited action).
export function ButtonsVariant({ response, disabled, onPick }) {
  return (
    <div style={{ display: 'flex', gap: 8, marginTop: 11, opacity: disabled ? 0.5 : 1 }}>
      {OPTIONS.map(({ value, label, Icon, fill }) => {
        const on = response === value;
        const invite = value === 'going' && !response;
        return (
          <button key={value} type="button" onClick={(e) => onPick(e, value)} className="as-press" aria-pressed={on}
            style={{
              flex: 1, minHeight: 44, borderRadius: 8, fontSize: 13, fontWeight: 700, fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, cursor: 'pointer',
              ...(on
                ? { backgroundColor: fill, color: 'var(--as-text-inverse)', border: 'none', boxShadow: 'var(--as-shadow-sm)' }
                : { backgroundColor: 'var(--as-bg-card)', color: invite ? 'var(--as-success)' : 'var(--as-text-secondary)', border: `1.5px solid ${invite ? 'var(--as-success)' : 'var(--as-border-default)'}` }),
              ...(disabled ? { pointerEvents: 'none' } : {}),
            }}>
            <Icon size={14} strokeWidth={1.75} aria-hidden="true" />{label}
          </button>
        );
      })}
    </div>
  );
}

// COMPACT: one 44px 3-way segmented control.
export function SegmentedVariant({ response, disabled, onPick }) {
  return (
    <div style={{ display: 'flex', marginTop: 8, border: '1.5px solid var(--as-border-default)', borderRadius: 8, overflow: 'hidden', minHeight: 44, opacity: disabled ? 0.5 : 1 }}>
      {OPTIONS.map(({ value, label, Icon, fill, soft }, i) => {
        const on = response === value;
        return (
          <button key={value} type="button" onClick={(e) => onPick(e, value)} className="as-press" aria-pressed={on}
            style={{ flex: 1, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, fontSize: 13, fontWeight: 600, fontFamily: 'inherit', border: 'none', borderLeft: i > 0 ? '1.5px solid var(--as-border-default)' : 'none', background: 'transparent', color: 'var(--as-text-secondary)', cursor: 'pointer', ...(on ? { backgroundColor: soft, color: fill, fontWeight: 700 } : {}), ...(disabled ? { pointerEvents: 'none' } : {}) }}>
            <Icon size={13} strokeWidth={1.75} aria-hidden="true" />{label}
          </button>
        );
      })}
    </div>
  );
}

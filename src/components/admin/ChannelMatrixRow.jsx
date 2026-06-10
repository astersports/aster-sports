import { Check } from 'lucide-react';

// One row of the S9 channel matrix: a category label + a Push cell + an Email
// cell (SMS omitted — no SMS sender in the stack, S9 FLAG 1). Cells are
// checkbox-role toggles. The Defaults row renders bold on a tinted background.
function Cell({ label, on, onClick }) {
  return (
    <button
      type="button" role="checkbox" aria-checked={on} aria-label={label} onClick={onClick}
      className="as-press"
      style={{ width: 56, display: 'flex', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
    >
      <span style={{
        width: 26, height: 26, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: on ? 'none' : '1.5px solid var(--as-border-default)',
        backgroundColor: on ? 'var(--as-accent)' : 'var(--as-bg-card)',
      }}>
        {on && <Check size={15} strokeWidth={3} aria-hidden="true" style={{ color: 'var(--as-text-inverse)' }} />}
      </span>
    </button>
  );
}

export default function ChannelMatrixRow({ label, isDefault, push, email, onPush, onEmail }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', padding: '10px 12px',
      borderBottom: '1px solid var(--as-border-subtle)',
      backgroundColor: isDefault ? 'var(--as-bg-card-hover)' : 'transparent',
    }}>
      <span style={{ flex: 1, fontSize: 14, fontWeight: isDefault ? 600 : 500, color: 'var(--as-text-primary)' }}>
        {label}
      </span>
      <Cell label={`${label} push`} on={push} onClick={() => onPush(!push)} />
      <Cell label={`${label} email`} on={email} onClick={() => onEmail(!email)} />
    </div>
  );
}

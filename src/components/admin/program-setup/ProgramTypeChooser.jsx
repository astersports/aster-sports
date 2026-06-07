import { Field } from '../../register/fields';
import { PROGRAM_TYPE_KEYS, programRule } from '../../../lib/programRegistry';

// Program-type selector for admin program create. Entries + helper copy read
// PROGRAM_TYPE_REGISTRY (single source) — the parity test asserts these keys
// equal the registry keys and the DB enum, so the chooser can't drift.
const TYPES = PROGRAM_TYPE_KEYS.map((key) => ({ key, label: programRule(key).label }));

export default function ProgramTypeChooser({ value, onChange }) {
  return (
    <Field label="Program type">
      <div style={chipWrap}>
        {TYPES.map((t) => {
          const on = value === t.key;
          return (
            <button
              key={t.key} type="button" className="as-press" aria-pressed={on}
              onClick={() => onChange(t.key)}
              style={{ ...chip, ...(on ? chipOn : null) }}
            >
              {t.label}
            </button>
          );
        })}
      </div>
      <div style={helperBox}>{programRule(value).chooserHelper}</div>
    </Field>
  );
}

const chipWrap = { display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 10 };
const chip = {
  minHeight: 34, padding: '0 13px', borderRadius: 8, cursor: 'pointer',
  border: '1px solid var(--as-border-default)', backgroundColor: 'var(--as-bg-card)',
  color: 'var(--as-text-secondary)', fontSize: 13, fontWeight: 600,
};
const chipOn = {
  backgroundColor: 'var(--as-accent)', color: 'var(--as-text-inverse)',
  borderColor: 'var(--as-accent)',
};
const helperBox = {
  fontSize: 12, color: 'var(--as-text-secondary)', backgroundColor: 'var(--as-bg-secondary)',
  border: '1px solid var(--as-border-subtle)', borderRadius: 8, padding: '9px 10px',
};

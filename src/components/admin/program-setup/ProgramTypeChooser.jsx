import { Field } from '../../register/fields';

// Program-type selector for admin program create (GO D1/D2). The chosen type
// drives status default, divisions visibility, and the helper copy below.
// 'season' first (the common case); the rest are non-season offerings.
const TYPES = [
  { key: 'season', label: 'Season' },
  { key: 'camp', label: 'Camp' },
  { key: 'clinic', label: 'Clinic' },
  { key: 'tryout', label: 'Tryout' },
  { key: 'evaluation', label: 'Eval' },
  { key: 'interest_list', label: 'Interest list' },
];

const HELPER = {
  season: 'Divisions and per-division fees. Created archived — activate it from Seasons when it starts.',
  camp: 'Time-bounded, flat fee, no divisions. Created active so it’s live right away.',
  clinic: 'Time-bounded, flat fee, no divisions. Created active so it’s live right away.',
  tryout: 'Pre-season tryout. No divisions. Created archived until you open it.',
  evaluation: 'Player evaluation. No divisions. Created archived until you open it.',
  interest_list: 'Collect signups before a program exists. No divisions. Created archived.',
};

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
      <div style={helperBox}>{HELPER[value] || HELPER.season}</div>
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

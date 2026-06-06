import { Field } from '../FormControls';

// Team-color swatch picker, extracted from TeamFormSheet so the sheet stays
// ≤150 LOC (F15). The hex values here are team_color values (the DB-bound
// inline-hex exception per CLAUDE.md §0 rule #4); the COLOR_SWATCHES name is
// what the §0 verification grep #3 whitelists.
const COLOR_SWATCHES = ['#7C3AED', '#18181B', '#2563EB', '#DC2626', '#EA580C', '#059669'];

export default function ColorPicker({ value, onChange }) {
  return (
    <Field label="Team color">
      <div className="flex flex-wrap gap-2">
        {COLOR_SWATCHES.map((hex) => (
          <button
            key={hex} type="button" className="as-press"
            onClick={() => onChange(hex)}
            aria-label={`Color ${hex}`} aria-pressed={value === hex}
            style={{
              width: 44, height: 44, borderRadius: '50%', backgroundColor: hex,
              border: `3px solid ${value === hex ? 'var(--as-text-primary)' : 'transparent'}`,
            }}
          />
        ))}
        <input
          type="color" aria-label="Custom color"
          value={value || '#2563EB'}
          onChange={(e) => onChange(e.target.value)}
          style={{ width: 44, height: 44, border: 'none', background: 'none' }}
        />
      </div>
    </Field>
  );
}

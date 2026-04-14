import { Plus, X } from 'lucide-react';

// Inline duty list editor for StepDetails. Returns an array of
// { name, slots_needed } to the parent form. Each duty will expand
// into N per-slot rows in event_duties on save (CLAUDE.md §5).
export default function DutyEditor({ value, onChange }) {
  const duties = value || [];

  const add = () => onChange([...duties, { name: '', slots_needed: 1 }]);
  const update = (i, patch) => onChange(duties.map((d, idx) => idx === i ? { ...d, ...patch } : d));
  const remove = (i) => onChange(duties.filter((_, idx) => idx !== i));

  return (
    <div>
      <span style={labelStyle}>Duties</span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 6 }}>
        {duties.map((d, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="text" value={d.duty_name || d.name || ''}
              onChange={(e) => update(i, { duty_name: e.target.value })}
              placeholder="e.g. Scorekeeper" style={{ ...inputStyle, flex: 1 }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <button type="button" disabled={(d.slots_needed || 1) <= 1}
                onClick={() => update(i, { slots_needed: Math.max(1, (d.slots_needed || 1) - 1) })}
                style={stepBtn}>−</button>
              <span style={{ minWidth: 20, textAlign: 'center', fontSize: 14, fontWeight: 500 }}>
                {d.slots_needed || 1}
              </span>
              <button type="button"
                onClick={() => update(i, { slots_needed: Math.min(10, (d.slots_needed || 1) + 1) })}
                style={stepBtn}>+</button>
            </div>
            <button type="button" onClick={() => remove(i)} className="sf-press"
              aria-label="Remove duty"
              style={{
                width: 40, height: 40, borderRadius: 10,
                border: '1px solid var(--sf-border-default)',
                backgroundColor: 'var(--sf-bg-card)', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
              }}>
              <X size={16} strokeWidth={1.75} color="var(--sf-text-tertiary)" />
            </button>
          </div>
        ))}
      </div>
      <button type="button" onClick={add} className="sf-press"
        style={{
          marginTop: 8, minHeight: 40, padding: '0 14px', borderRadius: 10,
          border: '1px solid var(--sf-border-default)',
          backgroundColor: 'var(--sf-bg-card)',
          color: 'var(--sf-accent)', fontSize: 13, fontWeight: 500,
          display: 'inline-flex', alignItems: 'center', gap: 6,
        }}>
        <Plus size={16} strokeWidth={1.75} /> Add duty
      </button>
    </div>
  );
}

const labelStyle = { fontSize: 13, fontWeight: 500, color: 'var(--sf-text-secondary)', display: 'block' };
const inputStyle = {
  minHeight: 40, borderRadius: 10, border: '1px solid var(--sf-border-default)',
  backgroundColor: 'var(--sf-bg-card)', padding: '0 10px', fontSize: 14,
  color: 'var(--sf-text-primary)',
};

const stepBtn = {
  width: 32, height: 32, borderRadius: 8,
  border: '1px solid var(--sf-border-default)',
  backgroundColor: 'var(--sf-bg-card)', color: 'var(--sf-text-primary)',
  fontSize: 16, fontWeight: 500, cursor: 'pointer',
};

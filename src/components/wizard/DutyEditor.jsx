import { Plus, X } from 'lucide-react';
import Input from '../shared/Input';

// Inline duty list editor for StepDetails. Returns an array of
// { name, slots_needed } to the parent form. Each duty will expand
// into N per-slot rows in event_duties on save (CLAUDE.md §5).
export default function DutyEditor({ value, onChange }) {
  const duties = value || [];

  const add = () => onChange([...duties, { duty_name: '', slots_needed: 1 }]);
  const update = (i, patch) => onChange(duties.map((d, idx) => idx === i ? { ...d, ...patch } : d));
  const remove = (i) => onChange(duties.filter((_, idx) => idx !== i));

  return (
    <div>
      <span style={labelStyle}>Volunteers</span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 6 }}>
        {duties.map((d, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Input type="text" value={d.duty_name || d.name || ''}
              onChange={(e) => update(i, { duty_name: e.target.value })}
              placeholder="e.g. Scorekeeper" style={{ flex: 1 }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <button type="button" disabled={(d.slots_needed || 1) <= 1}
                aria-label="Decrease slots"
                onClick={() => update(i, { slots_needed: Math.max(1, (d.slots_needed || 1) - 1) })}
                style={stepBtn}>−</button>
              <span style={{ minWidth: 20, textAlign: 'center', fontSize: 15, fontWeight: 500 }}>
                {d.slots_needed || 1}
              </span>
              <button type="button" aria-label="Increase slots"
                onClick={() => update(i, { slots_needed: Math.min(10, (d.slots_needed || 1) + 1) })}
                style={stepBtn}>+</button>
            </div>
            <button type="button" onClick={() => remove(i)} className="as-press"
              aria-label="Remove volunteer"
              style={{
                width: 44, height: 44, borderRadius: 10, flexShrink: 0,
                border: '1px solid var(--as-border-default)',
                backgroundColor: 'var(--as-bg-card)', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
              }}>
              <X size={16} strokeWidth={1.75} color="var(--as-text-tertiary)" />
            </button>
          </div>
        ))}
      </div>
      <button type="button" onClick={add} className="as-press"
        style={{
          marginTop: 8, minHeight: 40, padding: '0 14px', borderRadius: 10,
          border: '1px solid var(--as-border-default)',
          backgroundColor: 'var(--as-bg-card)',
          color: 'var(--as-accent)', fontSize: 13, fontWeight: 500,
          display: 'inline-flex', alignItems: 'center', gap: 6,
        }}>
        <Plus size={16} strokeWidth={1.75} /> Add volunteer
      </button>
    </div>
  );
}

const labelStyle = { fontSize: 13, fontWeight: 500, color: 'var(--as-text-secondary)', display: 'block' };

const stepBtn = {
  width: 44, height: 44, borderRadius: 8, flexShrink: 0,
  border: '1px solid var(--as-border-default)',
  backgroundColor: 'var(--as-bg-card)', color: 'var(--as-text-primary)',
  fontSize: 17, fontWeight: 500, cursor: 'pointer',
};

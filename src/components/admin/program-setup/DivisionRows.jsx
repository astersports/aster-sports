import { Field, SelectInput, TextInput } from '../../register/fields';
import { ghostBtn } from '../../register/registerStyles';

// Dynamic division editor for the admin program-setup form. Gender is M/F only for seasons
// (spec §3.2 / F5 Q1 — Co-Ed is camps only). Each row → a division + a base Season Fee.
const GENDERS = [{ value: '', label: 'Mixed / —' }, { value: 'F', label: 'Girls' }, { value: 'M', label: 'Boys' }];
const emptyRow = () => ({ name: '', grade_min: '', grade_max: '', gender: '', fee: '' });

export default function DivisionRows({ divisions, onChange }) {
  const update = (i, key, val) => onChange(divisions.map((d, idx) => (idx === i ? { ...d, [key]: val } : d)));
  const add = () => onChange([...divisions, emptyRow()]);
  const remove = (i) => onChange(divisions.filter((_, idx) => idx !== i));

  return (
    <div>
      {divisions.map((d, i) => (
        <div key={i} style={rowBox}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--em-text-tertiary)' }}>Division {i + 1}</span>
            {divisions.length > 1 && (
              <button type="button" onClick={() => remove(i)} style={{ background: 'none', border: 'none', color: 'var(--em-danger)', fontSize: 13, cursor: 'pointer' }}>Remove</button>
            )}
          </div>
          <Field label="Name" htmlFor={`dn-${i}`}><TextInput id={`dn-${i}`} value={d.name} onChange={(v) => update(i, 'name', v)} placeholder="11U Girls" /></Field>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1 }}><Field label="Grade min" htmlFor={`gmin-${i}`}><TextInput id={`gmin-${i}`} type="number" value={d.grade_min} onChange={(v) => update(i, 'grade_min', v)} /></Field></div>
            <div style={{ flex: 1 }}><Field label="Grade max" htmlFor={`gmax-${i}`}><TextInput id={`gmax-${i}`} type="number" value={d.grade_max} onChange={(v) => update(i, 'grade_max', v)} /></Field></div>
          </div>
          <Field label="Gender" htmlFor={`gen-${i}`}><SelectInput id={`gen-${i}`} value={d.gender} onChange={(v) => update(i, 'gender', v)} options={GENDERS} /></Field>
          <Field label="Season fee ($)" htmlFor={`fee-${i}`}><TextInput id={`fee-${i}`} type="number" value={d.fee} onChange={(v) => update(i, 'fee', v)} placeholder="800" /></Field>
        </div>
      ))}
      <button type="button" onClick={add} style={{ ...ghostBtn, width: '100%', marginBottom: 12 }}>+ Add division</button>
    </div>
  );
}

const rowBox = { padding: 12, borderRadius: 10, border: '1px solid var(--em-border-subtle)', backgroundColor: 'var(--em-bg-secondary)', marginBottom: 12 };

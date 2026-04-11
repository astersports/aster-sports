import { useState } from 'react';
import BottomSheet from '../shared/BottomSheet';
import ConfirmDialog from '../shared/ConfirmDialog';
import { Field, Input, ChipField } from './FormControls';

const AGE_GROUPS = ['8U', '9U', '10U', '11U', '12U'].map((a) => ({ key: a, label: a }));
const GENDERS = [
  { key: 'male',   label: 'Male'   },
  { key: 'female', label: 'Female' },
  { key: 'coed',   label: 'Coed'   },
];
const CIRCUITS = [
  { key: 'aau',         label: 'AAU'         },
  { key: 'league_play', label: 'League Play' },
  { key: 'tournament',  label: 'Tournament'  },
];
const COLOR_SWATCHES = ['#7C3AED', '#18181B', '#2563EB', '#DC2626', '#EA580C', '#059669'];
const DAYS = [
  { key: 'mon', label: 'Mon' }, { key: 'tue', label: 'Tue' },
  { key: 'wed', label: 'Wed' }, { key: 'thu', label: 'Thu' },
  { key: 'fri', label: 'Fri' }, { key: 'sat', label: 'Sat' },
  { key: 'sun', label: 'Sun' },
];

// Columns the form edits. Everything else on the row (id, org_id, season_id,
// timestamps) is owned by the server and stripped before save.
const EMPTY = {
  name: '', age_group: '10U', gender: 'male', circuit: 'aau',
  circuit_name: '', team_color: '#2563EB', practice_day: '',
  practice_location: '', sort_order: 0,
};

// Outer shell: BottomSheet only renders when `open` is true, so Body
// mounts fresh each time and can initialize state from `program` directly
// — no effect-based reset needed.
export default function TeamFormSheet({ open, program, onClose, onSave, onDelete }) {
  return (
    <BottomSheet open={open} onClose={onClose} initialHeight="90%" expandedHeight="95%">
      <Body key={program?.id ?? 'new'} program={program} onSave={onSave} onDelete={onDelete} />
    </BottomSheet>
  );
}

function Body({ program, onSave, onDelete }) {
  const editing = !!program;
  const [form, setForm] = useState(editing ? { ...EMPTY, ...program } : EMPTY);
  const [confirmDel, setConfirmDel] = useState(false);
  const patch = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = () => {
    if (!form.name.trim()) return;
    onSave({
      name: form.name.trim(),
      age_group: form.age_group,
      gender: form.gender,
      circuit: form.circuit,
      circuit_name: form.circuit === 'aau' ? (form.circuit_name || null) : null,
      team_color: form.team_color,
      practice_day: form.practice_day || null,
      practice_location: form.practice_location || null,
      sort_order: Number(form.sort_order) || 0,
    });
  };

  return (
    <>
      <div className="pt-2">
        <h2 className="font-semibold mb-4" style={{ color: 'var(--sf-text-primary)', fontSize: 18 }}>
          {editing ? 'Edit team' : 'New team'}
        </h2>

        <Field label="Display name">
          <Input value={form.name} onChange={(v) => patch('name', v)} placeholder="10U Black" />
        </Field>
        <ChipField label="Age group" options={AGE_GROUPS} value={form.age_group} onChange={(v) => patch('age_group', v)} />
        <ChipField label="Gender" options={GENDERS} value={form.gender} onChange={(v) => patch('gender', v)} />
        <ChipField label="Competition type" options={CIRCUITS} value={form.circuit} onChange={(v) => patch('circuit', v)} />
        {form.circuit === 'aau' && (
          <Field label="Circuit name">
            <Input value={form.circuit_name ?? ''} onChange={(v) => patch('circuit_name', v)} placeholder="Zero Gravity" />
          </Field>
        )}

        <Field label="Team color">
          <div className="flex flex-wrap gap-2">
            {COLOR_SWATCHES.map((hex) => (
              <button
                key={hex} type="button" className="sf-press"
                onClick={() => patch('team_color', hex)}
                aria-label={`Color ${hex}`} aria-pressed={form.team_color === hex}
                style={{
                  width: 44, height: 44, borderRadius: '50%', backgroundColor: hex,
                  border: `3px solid ${form.team_color === hex ? 'var(--sf-text-primary)' : 'transparent'}`,
                }}
              />
            ))}
            <input
              type="color" aria-label="Custom color"
              value={form.team_color || '#2563EB'}
              onChange={(e) => patch('team_color', e.target.value)}
              style={{ width: 44, height: 44, border: 'none', background: 'none' }}
            />
          </div>
        </Field>

        <ChipField label="Practice day" options={DAYS} value={form.practice_day ?? ''} onChange={(v) => patch('practice_day', v)} />
        <Field label="Practice location">
          <Input value={form.practice_location ?? ''} onChange={(v) => patch('practice_location', v)} placeholder="St. Patrick's Gym" />
        </Field>
        <Field label="Sort order">
          <Input type="number" value={String(form.sort_order ?? 0)} onChange={(v) => patch('sort_order', v)} />
        </Field>

        <div className="flex gap-2 mt-4">
          {editing && (
            <button
              type="button" onClick={() => setConfirmDel(true)}
              className="flex-1 font-semibold sf-press"
              style={{
                minHeight: 44, borderRadius: 10, fontSize: 15,
                backgroundColor: 'var(--sf-danger-soft)', color: 'var(--sf-danger)',
              }}
            >Delete</button>
          )}
          <button
            type="button" onClick={submit}
            className="flex-1 font-semibold sf-press sf-bounce-tap"
            style={{
              minHeight: 44, borderRadius: 10, fontSize: 15,
              backgroundColor: 'var(--sf-accent)', color: 'var(--sf-text-inverse)',
            }}
          >{editing ? 'Save changes' : 'Create team'}</button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDel}
        title="Delete this team?"
        message="Events, roster assignments, and RSVPs for this team will also be removed."
        confirmLabel="Delete"
        destructive
        onCancel={() => setConfirmDel(false)}
        onConfirm={() => { setConfirmDel(false); onDelete?.(program.id); }}
      />
    </>
  );
}

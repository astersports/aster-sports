import { useState } from 'react';
import FullScreenForm from '../shared/FullScreenForm';
import ConfirmDialog from '../shared/ConfirmDialog';
import ColorPicker from './team-form/ColorPicker';
import { ChipField, Field, Input } from './FormControls';
import { useTeamTypes } from '../../hooks/useTeamTypes';
import { defaultTeamTypeSlugForProgram, isCompetitiveSlug } from '../../lib/teamTypes';
import { AGE_GROUPS, CIRCUITS, DAYS, EMPTY, GENDERS, hintStyle, TEAM_TYPES, warnStyle } from './team-form/teamFormConstants';

// FullScreenForm unmounts children when closed, so Body mounts fresh
// each open and initializes state from `program` directly — no effect-
// based reset needed. The title flips on new vs. edit.
export default function TeamFormSheet({ open, program, programType = 'season', onClose, onSave, onDelete }) {
  const title = program ? 'Edit team' : 'New team';
  return (
    <FullScreenForm open={open} onClose={onClose} title={title}>
      <Body key={program?.id ?? 'new'} program={program} programType={programType} onSave={onSave} onDelete={onDelete} />
    </FullScreenForm>
  );
}

function Body({ program, programType, onSave, onDelete }) {
  const editing = !!program;
  const { bySlug } = useTeamTypes();
  const [form, setForm] = useState(editing ? { ...EMPTY, ...program } : EMPTY);
  const [teamType, setTeamType] = useState(null);
  const [confirmDel, setConfirmDel] = useState(false);
  const patch = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // Active team_type slug: explicit pick → editing team's current type (reverse-
  // mapped once the catalog loads) → smart default for the program type.
  const idToSlug = Object.fromEntries(Object.entries(bySlug).map(([s, id]) => [id, s]));
  const initialType = (editing && idToSlug[program.team_type_id]) || defaultTeamTypeSlugForProgram(programType);
  const effectiveType = teamType ?? initialType;
  const competitive = isCompetitiveSlug(effectiveType);

  const submit = () => {
    if (!form.name.trim()) return;
    const teamTypeId = bySlug[effectiveType];
    if (!teamTypeId) return; // F1: never write team_type_id NULL — wait for the catalog
    onSave({
      name: form.name.trim(),
      team_type_id: teamTypeId,
      age_group: form.age_group,
      gender: form.gender,
      // non-competitive teams keep the 'aau' default (hidden); satisfies the CHECK.
      circuit: competitive ? form.circuit : 'aau',
      circuit_name: competitive && form.circuit === 'aau' ? (form.circuit_name || null) : null,
      team_color: form.team_color,
      practice_day: form.practice_day || null,
      practice_location: form.practice_location || null,
      sort_order: Number(form.sort_order) || 0,
    });
  };

  return (
    <>
      <div>
        <Field label="Display name" required>
          <Input value={form.name} onChange={(v) => patch('name', v)} placeholder="10U Black" />
        </Field>

        <ChipField label="Team type" options={TEAM_TYPES} value={effectiveType} onChange={setTeamType} required />
        {!competitive && (
          <div style={hintStyle}>Non-competitive — kept off records, standings, and brackets.</div>
        )}
        {competitive && programType !== 'season' && (
          <div style={warnStyle}>Competitive type: this team will appear in standings and game pickers.</div>
        )}

        <ChipField label="Age group" options={AGE_GROUPS} value={form.age_group} onChange={(v) => patch('age_group', v)} required />
        <ChipField label="Gender" options={GENDERS} value={form.gender} onChange={(v) => patch('gender', v)} required />
        {competitive && (
          <>
            <ChipField label="Competition type" options={CIRCUITS} value={form.circuit} onChange={(v) => patch('circuit', v)} required />
            {form.circuit === 'aau' && (
              <Field label="Circuit name">
                <Input value={form.circuit_name ?? ''} onChange={(v) => patch('circuit_name', v)} placeholder="Zero Gravity" />
              </Field>
            )}
          </>
        )}

        <ColorPicker value={form.team_color} onChange={(v) => patch('team_color', v)} />

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
              className="flex-1 font-semibold as-press"
              style={{
                minHeight: 44, borderRadius: 10, fontSize: 15,
                backgroundColor: 'var(--as-danger-soft)', color: 'var(--as-danger)',
              }}
            >Delete</button>
          )}
          <button
            type="button" onClick={submit}
            className="flex-1 font-semibold as-press as-bounce-tap"
            style={{
              minHeight: 44, borderRadius: 10, fontSize: 15,
              backgroundColor: 'var(--as-accent)', color: 'var(--as-text-inverse)',
            }}
          >{editing ? 'Save changes' : 'Create team'}</button>
        </div>
      </div>

      {confirmDel && <ConfirmDialog
        title="Delete this team?"
        message="Events, roster assignments, and RSVPs for this team will also be removed."
        confirmLabel="Delete"
        destructive
        onCancel={() => setConfirmDel(false)}
        onConfirm={() => { setConfirmDel(false); onDelete?.(program.id); }}
      />}
    </>
  );
}

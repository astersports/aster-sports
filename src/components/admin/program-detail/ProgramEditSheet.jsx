import { useState } from 'react';
import FullScreenForm from '../../shared/FullScreenForm';
import { Field, TextInput } from '../../register/fields';
import { primaryBtn } from '../../register/registerStyles';
import { slugify, validateProgramDates } from '../../../lib/programSetup';

// timestamptz → datetime-local ('YYYY-MM-DDTHH:MM') for the input value.
const toLocalInput = (ts) => (ts ? ts.slice(0, 16) : '');

// Edit a program's name / dates / public link / publish state (PR-3 F14).
// 3+ fields → FullScreenForm (anti-pattern #15). program_type is intentionally
// NOT editable here (changing a created program's type is a separate concern);
// status/archive is deferred to the draft-status build. Slug is normalized on
// save so a typed link can't store a mixed-case variant (F3).
export default function ProgramEditSheet({ open, program, onClose, onSave }) {
  return (
    <FullScreenForm open={open} onClose={onClose} title="Edit program">
      <Body key={program?.id} program={program} onSave={onSave} />
    </FullScreenForm>
  );
}

function Body({ program, onSave }) {
  const [form, setForm] = useState({
    name: program?.name || '', start_date: program?.start_date || '', end_date: program?.end_date || '',
    reg_opens_at: toLocalInput(program?.reg_opens_at), reg_closes_at: toLocalInput(program?.reg_closes_at),
    public_slug: program?.public_slug || '', is_published: !!program?.is_published,
  });
  const [err, setErr] = useState(null);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const valid = form.name.trim().length > 0;

  const submit = () => {
    if (!valid) return;
    const dateErr = validateProgramDates(form);
    if (dateErr) { setErr(dateErr); return; }
    onSave({
      name: form.name.trim(),
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      reg_opens_at: form.reg_opens_at || null,
      reg_closes_at: form.reg_closes_at || null,
      public_slug: slugify(form.public_slug || form.name) || null,
      is_published: form.is_published,
    });
  };

  return (
    <div>
      <Field label="Program name" htmlFor="ep-name"><TextInput id="ep-name" value={form.name} onChange={(v) => set('name', v)} /></Field>
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}><Field label="Start date" htmlFor="ep-sd"><TextInput id="ep-sd" type="date" value={form.start_date} onChange={(v) => set('start_date', v)} /></Field></div>
        <div style={{ flex: 1, minWidth: 0 }}><Field label="End date" htmlFor="ep-ed"><TextInput id="ep-ed" type="date" value={form.end_date} onChange={(v) => set('end_date', v)} /></Field></div>
      </div>
      {/* datetime-local needs the full row — half-width overflows iOS (the date+time value won't shrink). */}
      <Field label="Registration opens" htmlFor="ep-ro"><TextInput id="ep-ro" type="datetime-local" value={form.reg_opens_at} onChange={(v) => set('reg_opens_at', v)} /></Field>
      <Field label="Registration closes" htmlFor="ep-rc"><TextInput id="ep-rc" type="datetime-local" value={form.reg_closes_at} onChange={(v) => set('reg_closes_at', v)} /></Field>
      <Field label={`Public link · /r/${slugify(form.public_slug || form.name) || '…'}`} htmlFor="ep-slug">
        <TextInput id="ep-slug" value={form.public_slug} onChange={(v) => set('public_slug', v)} />
      </Field>
      <label style={checkRow}>
        <input type="checkbox" checked={form.is_published} onChange={(e) => set('is_published', e.target.checked)} />
        Published (parents can register at the public link)
      </label>
      {err && <div style={errStyle}>{err}</div>}
      <button type="button" className="as-press" style={{ ...primaryBtn, opacity: valid ? 1 : 0.5 }} disabled={!valid} onClick={submit}>
        Save changes
      </button>
    </div>
  );
}

const checkRow = { display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--as-text-secondary)', margin: '0 0 12px' };
const errStyle = { fontSize: 13, color: 'var(--as-danger)', backgroundColor: 'var(--as-danger-soft)', borderRadius: 8, padding: '8px 10px', marginBottom: 10 };

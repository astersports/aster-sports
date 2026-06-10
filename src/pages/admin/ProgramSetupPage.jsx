import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Field, TextInput } from '../../components/register/fields';
import { primaryBtn } from '../../components/register/registerStyles';
import DivisionRows from '../../components/admin/program-setup/DivisionRows';
import ProgramTypeChooser from '../../components/admin/program-setup/ProgramTypeChooser';
import SeasonPresetPicker from '../../components/admin/program-setup/SeasonPresetPicker';
import AdminBackHeader from '../../components/admin/AdminBackHeader';
import { slugify, useProgramSetup } from '../../hooks/useProgramSetup';

// Admin program-setup (spec §3, MVP, Season-first per Q-3). Lean single-page create form:
// program basics + registration window + publish toggle + divisions/fees. Tryout/Camp are
// deferred follow-ups (the picker shows them as "coming soon").
export default function ProgramSetupPage() {
  const navigate = useNavigate();
  const { createProgram, saving, error } = useProgramSetup();
  const [form, setForm] = useState({
    program_type: 'season',
    name: '', start_date: '', end_date: '', public_slug: '',
    reg_opens_at: '', reg_closes_at: '', is_published: false,
    divisions: [{ name: '', grade_min: '', grade_max: '', gender: '', fee: '' }],
  });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const valid = form.name.trim().length > 0;
  const slugPreview = slugify(form.public_slug || form.name);

  async function handleCreate() {
    const r = await createProgram(form);
    if (r.ok) navigate(`/admin/programs/${r.programId}`);
  }

  return (
    <div style={wrap}>
      <AdminBackHeader to="/admin/programs" />
      <h1 style={h1Style}>New Program</h1>
      <div style={{ height: 12 }} />

      <ProgramTypeChooser value={form.program_type} onChange={(v) => set('program_type', v)} />

      {form.program_type === 'season' && (
        <SeasonPresetPicker onApply={(p) => setForm((f) => ({ ...f, name: p.name, start_date: p.start_date, end_date: p.end_date }))} />
      )}

      <Field label="Program name" htmlFor="pname"><TextInput id="pname" value={form.name} onChange={(v) => set('name', v)} placeholder="Spring 2026" /></Field>
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}><Field label="Start date" htmlFor="sd"><TextInput id="sd" type="date" value={form.start_date} onChange={(v) => set('start_date', v)} /></Field></div>
        <div style={{ flex: 1, minWidth: 0 }}><Field label="End date" htmlFor="ed"><TextInput id="ed" type="date" value={form.end_date} onChange={(v) => set('end_date', v)} /></Field></div>
      </div>
      <Field label={`Public link  ·  /r/${slugPreview || '…'}`} htmlFor="slug"><TextInput id="slug" value={form.public_slug} onChange={(v) => set('public_slug', v)} placeholder={slugify(form.name) || 'auto from name'} /></Field>
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}><Field label="Registration opens" htmlFor="ro"><TextInput id="ro" type="date" value={form.reg_opens_at} onChange={(v) => set('reg_opens_at', v)} /></Field></div>
        <div style={{ flex: 1, minWidth: 0 }}><Field label="Registration closes" htmlFor="rc"><TextInput id="rc" type="date" value={form.reg_closes_at} onChange={(v) => set('reg_closes_at', v)} /></Field></div>
      </div>
      <label style={checkRow}>
        <input type="checkbox" checked={form.is_published} onChange={(e) => set('is_published', e.target.checked)} />
        Publish now (parents can register at the public link)
      </label>

      {form.program_type === 'season' && (
        <>
          <h2 style={h2Style}>Divisions</h2>
          <DivisionRows divisions={form.divisions} onChange={(d) => set('divisions', d)} />
        </>
      )}

      {error && <div style={errStyle}>{error}</div>}
      <button type="button" className="as-press" style={{ ...primaryBtn, opacity: valid && !saving ? 1 : 0.5 }} disabled={!valid || saving} onClick={handleCreate}>
        {saving ? 'Creating…' : 'Create program'}
      </button>
    </div>
  );
}

const wrap = { maxWidth: 600, margin: '0 auto', padding: '16px 16px 80px' };
const h1Style = { fontSize: 24, fontWeight: 700, color: 'var(--as-text-primary)', margin: '8px 0 0' };
const h2Style = { fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--as-text-tertiary)', margin: '20px 0 8px' };
const checkRow = { display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--as-text-secondary)', margin: '0 0 8px' };
const errStyle = { padding: '8px 12px', borderRadius: 10, backgroundColor: 'var(--as-danger-soft)', color: 'var(--as-danger)', fontSize: 13, marginBottom: 8 };

import { Field, SelectInput, TextInput } from './fields';
import { primaryBtn } from './registerStyles';

const GRADES = [2, 3, 4, 5, 6, 7, 8].map((g) => ({ value: String(g), label: `Grade ${g}` }));
const bandLabel = (lo, hi) => (lo === hi ? `grade ${lo}` : `grades ${lo}–${hi}`);

// Step 1 — player. Grade-band mismatch WARNS inline (spec §5.3); the server is the hard
// gate (submit_registration raises grade_below/above_band). Tap-to-switch suggestion is
// deferred polish per the lean-MVP scope.
export default function StepPlayer({ player, division, onField, onNext }) {
  const grade = player.grade ? parseInt(player.grade, 10) : null;
  const { grade_min: lo, grade_max: hi, name } = division;
  let warn = null;
  if (grade != null && lo != null && grade < lo) warn = `${name} is for ${bandLabel(lo, hi)}. Your player is grade ${grade}.`;
  if (grade != null && hi != null && grade > hi) warn = `${name} is for ${bandLabel(lo, hi)}. Your player is grade ${grade}.`;
  const valid = player.first_name?.trim() && player.last_name?.trim();

  return (
    <div>
      <Field label="First name" htmlFor="p-fn"><TextInput id="p-fn" value={player.first_name} onChange={(v) => onField('first_name', v)} /></Field>
      <Field label="Last name" htmlFor="p-ln"><TextInput id="p-ln" value={player.last_name} onChange={(v) => onField('last_name', v)} /></Field>
      <Field label="Date of birth" htmlFor="p-dob"><TextInput id="p-dob" type="date" value={player.dob} onChange={(v) => onField('dob', v)} /></Field>
      <Field label="Grade" htmlFor="p-grade"><SelectInput id="p-grade" value={player.grade} onChange={(v) => onField('grade', v)} options={[{ value: '', label: 'Select grade' }, ...GRADES]} /></Field>
      {warn && <div style={warnStyle}>{warn}</div>}
      <button type="button" className="as-press" style={{ ...primaryBtn, marginTop: 8, opacity: valid ? 1 : 0.5 }} disabled={!valid} onClick={onNext}>Next</button>
    </div>
  );
}

const warnStyle = { padding: '8px 12px', borderRadius: 10, backgroundColor: 'var(--as-info-soft)', color: 'var(--as-info)', fontSize: 13, marginBottom: 8 };

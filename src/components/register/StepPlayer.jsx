import { Field, SelectInput, TextInput } from './fields';
import { primaryBtn } from './registerStyles';

const GRADES = [2, 3, 4, 5, 6, 7, 8].map((g) => ({ value: String(g), label: `Grade ${g}` }));
const bandLabel = (lo, hi) => (lo === hi ? `grade ${lo}` : `grades ${lo}–${hi}`);

// Step 1 — player. Grade-band AND gender mismatch are HARD BLOCKS at this step
// (B3/R2, §16.3 + architect ruling): Next is disabled and a role=alert explains
// what's wrong + how to fix — no soft-warn-then-server-reject. The server raises
// grade_below/above_band (and, with M2/R7, gender_mismatch) as defense in depth,
// but a valid client path never reaches it. The gender control shows ONLY for a
// gendered division (male/female) — coed / unknown skips it (the non-season
// implicit unit is coed, so a tryout never asks).
const GENDERS = [['male', 'Boys'], ['female', 'Girls']];
export default function StepPlayer({ player, division, onField, onNext }) {
  const grade = player.grade ? parseInt(player.grade, 10) : null;
  const { grade_min: lo, grade_max: hi, name } = division;
  const outOfBand = grade != null && ((lo != null && grade < lo) || (hi != null && grade > hi));
  const gradeMsg = outOfBand
    ? `${name || 'This division'} is for ${bandLabel(lo, hi)} — your player is in grade ${grade}. Pick a division that fits their grade.`
    : null;

  const divGendered = division.gender === 'male' || division.gender === 'female';
  const genderMismatch = divGendered && player.gender && player.gender !== division.gender;
  const genderMsg = genderMismatch
    ? `${name || 'This division'} is for ${division.gender === 'male' ? 'boys' : 'girls'} — pick a division that fits ${player.first_name?.trim() || 'your player'}.`
    : null;

  const valid = player.first_name?.trim() && player.last_name?.trim() && !outOfBand
    && (!divGendered || (player.gender && !genderMismatch));

  return (
    <div>
      <Field label="First name" htmlFor="p-fn"><TextInput id="p-fn" value={player.first_name} onChange={(v) => onField('first_name', v)} /></Field>
      <Field label="Last name" htmlFor="p-ln"><TextInput id="p-ln" value={player.last_name} onChange={(v) => onField('last_name', v)} /></Field>
      <Field label="Date of birth" htmlFor="p-dob"><TextInput id="p-dob" type="date" value={player.dob} onChange={(v) => onField('dob', v)} /></Field>
      <Field label="Grade" htmlFor="p-grade"><SelectInput id="p-grade" value={player.grade} onChange={(v) => onField('grade', v)} options={[{ value: '', label: 'Select grade' }, ...GRADES]} /></Field>
      {divGendered && (
        <div style={{ marginBottom: 12 }}>
          <span style={segLabel}>Division group</span>
          <div style={segWrap} role="group" aria-label="Division group">
            {GENDERS.map(([val, lbl]) => (
              <button key={val} type="button" aria-pressed={player.gender === val}
                style={{ ...segBtn, ...(player.gender === val ? segSel : {}) }} onClick={() => onField('gender', val)}>{lbl}</button>
            ))}
          </div>
        </div>
      )}
      {(gradeMsg || genderMsg) && <div role="alert" style={blockStyle}>{gradeMsg || genderMsg}</div>}
      <button type="button" className="as-press" style={{ ...primaryBtn, marginTop: 8, opacity: valid ? 1 : 0.5 }} disabled={!valid} onClick={onNext}>Next</button>
    </div>
  );
}

const blockStyle = { padding: '8px 12px', borderRadius: 10, backgroundColor: 'var(--as-danger-soft)', color: 'var(--as-danger)', fontSize: 13, marginBottom: 8 };
const segLabel = { display: 'block', fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--as-text-tertiary)', margin: '0 0 4px' };
const segWrap = { display: 'flex', gap: 8 };
const segBtn = { flex: 1, minHeight: 44, border: '1.5px solid var(--as-border-default)', backgroundColor: 'var(--as-bg-card)', borderRadius: 10, fontSize: 15, fontWeight: 600, color: 'var(--as-text-secondary)', cursor: 'pointer' };
const segSel = { borderColor: 'var(--as-accent)', backgroundColor: 'var(--as-accent-soft)', color: 'var(--as-accent)' };

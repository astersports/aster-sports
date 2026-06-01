import { Field, TextInput } from './fields';
import { ghostBtn, primaryBtn } from './registerStyles';

// Step 3 — optional details. All fields optional (lean MVP: plain inputs; chip-picker
// BottomSheets + custom-response forms deferred). Sizes land on player_equipment, the
// rest on the registration row, via submit_registration.
export default function StepDetails({ details, onField, onBack, onNext }) {
  return (
    <div>
      <p style={hint}>All optional — you can add these anytime.</p>
      <Field label="Jersey size" htmlFor="d-js"><TextInput id="d-js" value={details.jersey_size} onChange={(v) => onField('jersey_size', v)} placeholder="YS / YM / YL / AS…" /></Field>
      <Field label="Shorts size" htmlFor="d-ss"><TextInput id="d-ss" value={details.shorts_size} onChange={(v) => onField('shorts_size', v)} placeholder="YS / YM / YL / AS…" /></Field>
      <Field label="Emergency contact name" htmlFor="d-en"><TextInput id="d-en" value={details.emergency_contact_name} onChange={(v) => onField('emergency_contact_name', v)} /></Field>
      <Field label="Emergency contact phone" htmlFor="d-ep"><TextInput id="d-ep" type="tel" value={details.emergency_contact_phone} onChange={(v) => onField('emergency_contact_phone', v)} /></Field>
      <Field label="Medical notes" htmlFor="d-mn"><TextInput id="d-mn" value={details.medical_notes} onChange={(v) => onField('medical_notes', v)} placeholder="Allergies, conditions…" /></Field>
      <div style={btnRow}>
        <button type="button" style={ghostBtn} onClick={onBack}>Back</button>
        <button type="button" className="as-press" style={{ ...primaryBtn, flex: 1 }} onClick={onNext}>Review</button>
      </div>
    </div>
  );
}

const hint = { fontSize: 13, color: 'var(--as-text-tertiary)', margin: '0 0 12px' };
const btnRow = { display: 'flex', gap: 8, marginTop: 8 };

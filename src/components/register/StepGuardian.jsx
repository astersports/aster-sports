import { Field, SelectInput, TextInput } from './fields';
import { ghostBtn, primaryBtn } from './registerStyles';

const REL = ['parent', 'mother', 'father', 'guardian', 'grandparent', 'other']
  .map((r) => ({ value: r, label: r[0].toUpperCase() + r.slice(1) }));

// Step 2 — guardian (+ optional co-guardian; 62% of LH players have 2 parents). Email is
// required: it's the unique key the submit RPC upserts on + the magic-link claim target.
export default function StepGuardian({ guardian, coGuardian, onField, onCogField, onToggleCog, onBack, onNext }) {
  const valid = guardian.first_name?.trim() && guardian.last_name?.trim() && /\S+@\S+\.\S+/.test(guardian.email || '');
  return (
    <div>
      <Field label="First name" htmlFor="g-fn"><TextInput id="g-fn" value={guardian.first_name} onChange={(v) => onField('first_name', v)} autoComplete="given-name" /></Field>
      <Field label="Last name" htmlFor="g-ln"><TextInput id="g-ln" value={guardian.last_name} onChange={(v) => onField('last_name', v)} autoComplete="family-name" /></Field>
      <Field label="Email" htmlFor="g-em"><TextInput id="g-em" type="email" value={guardian.email} onChange={(v) => onField('email', v)} autoComplete="email" /></Field>
      <Field label="Phone" htmlFor="g-ph"><TextInput id="g-ph" type="tel" value={guardian.phone} onChange={(v) => onField('phone', v)} autoComplete="tel" /></Field>
      <Field label="Relationship" htmlFor="g-rel"><SelectInput id="g-rel" value={guardian.relationship} onChange={(v) => onField('relationship', v)} options={REL} /></Field>
      <label style={checkRow}>
        <input type="checkbox" checked={!!guardian.sms_opt_in} onChange={(e) => onField('sms_opt_in', e.target.checked)} />
        Text me game-day updates
      </label>

      {coGuardian ? (
        <div style={cogBox}>
          <Field label="Co-guardian first name" htmlFor="c-fn"><TextInput id="c-fn" value={coGuardian.first_name} onChange={(v) => onCogField('first_name', v)} /></Field>
          <Field label="Co-guardian last name" htmlFor="c-ln"><TextInput id="c-ln" value={coGuardian.last_name} onChange={(v) => onCogField('last_name', v)} /></Field>
          <Field label="Co-guardian email (optional)" htmlFor="c-em"><TextInput id="c-em" type="email" value={coGuardian.email} onChange={(v) => onCogField('email', v)} /></Field>
          <button type="button" onClick={onToggleCog} style={{ ...ghostBtn, width: '100%' }}>Remove co-guardian</button>
        </div>
      ) : (
        <button type="button" onClick={onToggleCog} style={{ ...ghostBtn, width: '100%', marginBottom: 12 }}>+ Add co-guardian</button>
      )}

      <div style={btnRow}>
        <button type="button" style={ghostBtn} onClick={onBack}>Back</button>
        <button type="button" className="em-press" style={{ ...primaryBtn, flex: 1, opacity: valid ? 1 : 0.5 }} disabled={!valid} onClick={onNext}>Next</button>
      </div>
    </div>
  );
}

const checkRow = { display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--em-text-secondary)', margin: '0 0 12px' };
const cogBox = { padding: 12, borderRadius: 10, border: '1px solid var(--em-border-subtle)', backgroundColor: 'var(--em-bg-secondary)', marginBottom: 12 };
const btnRow = { display: 'flex', gap: 8, marginTop: 8 };

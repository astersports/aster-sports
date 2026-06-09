import { useState } from 'react';
import FullScreenForm from '../shared/FullScreenForm';
import Toggle from '../shared/Toggle';

// Settings → General → Registration. Single bucket-A toggle (registration_open
// on organization_settings). Saves via useOrgSettings. Pessimistic save-and-close.

const WRAP = { display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 600, margin: '0 auto' };
const CARD = { backgroundColor: 'var(--as-bg-card)', border: '1px solid var(--as-border-default)', borderRadius: 10, boxShadow: 'var(--as-shadow-sm)', padding: '4px 12px' };
const SAVE = { minHeight: 44, borderRadius: 10, backgroundColor: 'var(--as-accent)', color: 'var(--as-text-inverse)', fontSize: 15 };

export default function RegistrationForm({ open, onClose, initial, onSave, saving }) {
  return (
    <FullScreenForm open={open} onClose={onClose} title="Registration">
      <Body initial={initial} onSave={onSave} saving={saving} onClose={onClose} />
    </FullScreenForm>
  );
}

function Body({ initial, onSave, saving, onClose }) {
  const [registrationOpen, setRegistrationOpen] = useState(!!initial.registrationOpen);
  const submit = async () => {
    const res = await onSave({ registration_open: registrationOpen });
    if (res?.ok) onClose();
  };
  return (
    <div style={WRAP}>
      <div style={CARD}>
        <Toggle
          label="Registration open"
          description="When on, families can sign up through your public registration links."
          checked={registrationOpen}
          onChange={setRegistrationOpen}
        />
      </div>
      <button type="button" onClick={submit} disabled={saving}
        className="w-full font-semibold as-press as-bounce-tap" style={{ ...SAVE, opacity: saving ? 0.6 : 1 }}>
        {saving ? 'Saving…' : 'Save'}
      </button>
    </div>
  );
}

import { useState } from 'react';
import FullScreenForm from '../shared/FullScreenForm';
import Input from '../shared/Input';

// Settings → General → Custom domain. Single bucket-A text field (custom_domain
// on organization_settings); blank saves as null. Saves via useOrgSettings.
// Pessimistic save-and-close.

const WRAP = { display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 600, margin: '0 auto' };
const HELP = { fontSize: 13, color: 'var(--as-text-tertiary)', lineHeight: 1.4, margin: '0 4px' };
const SAVE = { minHeight: 44, borderRadius: 10, backgroundColor: 'var(--as-accent)', color: 'var(--as-text-inverse)', fontSize: 15 };

export default function CustomDomainForm({ open, onClose, initial, onSave, saving }) {
  return (
    <FullScreenForm open={open} onClose={onClose} title="Custom domain">
      <Body initial={initial} onSave={onSave} saving={saving} onClose={onClose} />
    </FullScreenForm>
  );
}

function Body({ initial, onSave, saving, onClose }) {
  const [domain, setDomain] = useState(initial.customDomain || '');
  const submit = async () => {
    const res = await onSave({ custom_domain: domain.trim() || null });
    if (res?.ok) onClose();
  };
  return (
    <div style={WRAP}>
      <p style={HELP}>Point your own domain (e.g. teams.yourclub.com) at your public schedule. Leave blank to use the default Aster Sports address.</p>
      <Input label="Custom domain" value={domain} style={{ fontSize: 16 }}
        onChange={(e) => setDomain(e.target.value)} placeholder="teams.yourclub.com" />
      <button type="button" onClick={submit} disabled={saving}
        className="w-full font-semibold as-press as-bounce-tap" style={{ ...SAVE, opacity: saving ? 0.6 : 1 }}>
        {saving ? 'Saving…' : 'Save'}
      </button>
    </div>
  );
}

import { useState } from 'react';
import FullScreenForm from '../shared/FullScreenForm';
import Toggle from '../shared/Toggle';

// Settings → General → Features. Two bucket-A toggles (futures_academy_enabled,
// carpool_enabled on organization_settings). Saves via useOrgSettings.
// Pessimistic save-and-close.

const WRAP = { display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 600, margin: '0 auto' };
const CARD = { backgroundColor: 'var(--as-bg-card)', border: '1px solid var(--as-border-default)', borderRadius: 10, boxShadow: 'var(--as-shadow-sm)', padding: '4px 12px' };
const DIVIDER = { height: 1, backgroundColor: 'var(--as-border-subtle)', margin: '4px 0' };
const SAVE = { minHeight: 44, borderRadius: 10, backgroundColor: 'var(--as-accent)', color: 'var(--as-text-inverse)', fontSize: 15 };

export default function FeaturesForm({ open, onClose, initial, onSave, saving }) {
  return (
    <FullScreenForm open={open} onClose={onClose} title="Features">
      <Body initial={initial} onSave={onSave} saving={saving} onClose={onClose} />
    </FullScreenForm>
  );
}

function Body({ initial, onSave, saving, onClose }) {
  const [futures, setFutures] = useState(!!initial.futuresEnabled);
  const [carpool, setCarpool] = useState(!!initial.carpoolEnabled);
  const submit = async () => {
    const res = await onSave({ futures_academy_enabled: futures, carpool_enabled: carpool });
    if (res?.ok) onClose();
  };
  return (
    <div style={WRAP}>
      <div style={CARD}>
        <Toggle
          label="Futures Academy"
          description="Show the Futures Academy roster track for developing players."
          checked={futures}
          onChange={setFutures}
        />
        <div style={DIVIDER} />
        <Toggle
          label="Carpool"
          description="Let families offer and claim rides on the event ride board."
          checked={carpool}
          onChange={setCarpool}
        />
      </div>
      <button type="button" onClick={submit} disabled={saving}
        className="w-full font-semibold as-press as-bounce-tap" style={{ ...SAVE, opacity: saving ? 0.6 : 1 }}>
        {saving ? 'Saving…' : 'Save'}
      </button>
    </div>
  );
}

import { useState } from 'react';
import FullScreenForm from '../shared/FullScreenForm';
import Toggle from '../shared/Toggle';

// Operator control surface for organizations.feature_settings (directive
// 2026-06-12): ride-share + volunteer signups are org-level features.
// Off = the schedule facts line, event-detail sections, and coverage
// chips stop showing those programs entirely. Mirrors the
// AutoNotificationSettingsForm shape; writes via the admin-gated RPC.

const SECTION_LABEL = {
  fontSize: 11, fontWeight: 500, color: 'var(--as-text-tertiary)',
  textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px 4px',
};
const CARD = {
  backgroundColor: 'var(--as-bg-card)', border: '1px solid var(--as-border-default)',
  borderRadius: 10, boxShadow: 'var(--as-shadow-sm)', padding: '4px 12px',
};

export default function EventFeaturesForm({ open, onClose, initial, onSave, saving }) {
  return (
    <FullScreenForm open={open} onClose={onClose} title="Event features">
      <Body initial={initial} onSave={onSave} saving={saving} onClose={onClose} />
    </FullScreenForm>
  );
}

function Body({ initial, onSave, saving, onClose }) {
  const [rides, setRides] = useState(initial.ridesOn);
  const [duties, setDuties] = useState(initial.dutiesOn);

  const submit = async () => {
    const res = await onSave({ rides_enabled: rides, duties_enabled: duties });
    if (res?.ok) onClose();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 600, margin: '0 auto' }}>
      <div>
        <p style={SECTION_LABEL}>Ride share</p>
        <div style={CARD}>
          <Toggle
            label="Enable ride share"
            description="Families can offer and request rides on events. Off hides ride sections and 'rides needed' from schedule cards."
            checked={rides}
            onChange={setRides}
          />
        </div>
      </div>

      <div>
        <p style={SECTION_LABEL}>Volunteers</p>
        <div style={CARD}>
          <Toggle
            label="Enable volunteer signups"
            description="Snack and duty slots on events. Off hides volunteer sections and 'volunteers needed' from schedule cards."
            checked={duties}
            onChange={setDuties}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={submit}
        disabled={saving}
        className="w-full font-semibold as-press as-bounce-tap"
        style={{
          minHeight: 44, borderRadius: 10, opacity: saving ? 0.6 : 1,
          backgroundColor: 'var(--as-accent)', color: 'var(--as-text-inverse)', fontSize: 15,
        }}
      >
        {saving ? 'Saving…' : 'Save'}
      </button>
    </div>
  );
}

import { useState } from 'react';
import FullScreenForm from '../shared/FullScreenForm';
import Toggle from '../shared/Toggle';
import NumberStepper from '../shared/NumberStepper';

// A2 operator control surface for organizations.auto_notifications. Three
// controls: Stream A reminders (default ON), Stream B short-roster nudges
// (default OFF), and the going-floor stepper (default 5, disabled when nudges
// off). FullScreenForm per AP#15 (3 controls). Pessimistic Save: awaits the
// merged-write RPC via onSave and closes on success. FullScreenForm unmounts
// Body when closed, so Body re-seeds from `initial` on every open.

const SECTION_LABEL = {
  fontSize: 11, fontWeight: 500, color: 'var(--as-text-tertiary)',
  textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px 4px',
};
const CARD = {
  backgroundColor: 'var(--as-bg-card)', border: '1px solid var(--as-border-default)',
  borderRadius: 10, boxShadow: 'var(--as-shadow-sm)', padding: '4px 12px',
};

export default function AutoNotificationSettingsForm({ open, onClose, initial, onSave, saving }) {
  return (
    <FullScreenForm open={open} onClose={onClose} title="Automatic messages">
      <Body initial={initial} onSave={onSave} saving={saving} onClose={onClose} />
    </FullScreenForm>
  );
}

function Body({ initial, onSave, saving, onClose }) {
  const [reminders, setReminders] = useState(initial.remindersOn);
  const [nudges, setNudges] = useState(initial.nudgesOn);
  const [minGoing, setMinGoing] = useState(initial.minGoing);

  const submit = async () => {
    const res = await onSave({
      reminders_enabled: reminders,
      rsvp_nudges_enabled: nudges,
      rsvp_min_going: minGoing,
    });
    if (res?.ok) onClose();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 600, margin: '0 auto' }}>
      <div>
        <p style={SECTION_LABEL}>Event reminders</p>
        <div style={CARD}>
          <Toggle
            label="Send event reminders"
            description="Families get a reminder 3 days, 1 day, and 4 hours before each game."
            checked={reminders}
            onChange={setReminders}
          />
        </div>
      </div>

      <div>
        <p style={SECTION_LABEL}>Short-roster RSVP nudges</p>
        <div style={CARD}>
          <Toggle
            label="Draft short-roster nudges"
            description="When a game is within 48 hours and fewer than the minimum below have confirmed going, we'll draft a nudge to your Radar to review and send. Nothing sends to families automatically."
            checked={nudges}
            onChange={setNudges}
          />
          <div style={{ height: 1, backgroundColor: 'var(--as-border-subtle)', margin: '4px 0' }} />
          <NumberStepper
            label="Minimum confirmed going"
            description="You need this many confirmed to field a game."
            value={minGoing}
            onChange={setMinGoing}
            min={1}
            max={15}
            disabled={!nudges}
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

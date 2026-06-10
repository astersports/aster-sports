import { useState } from 'react';
import FullScreenForm from '../shared/FullScreenForm';
import Toggle from '../shared/Toggle';
import ChannelMatrixRow from './ChannelMatrixRow';

// S9 Channels: a Push/Email matrix over the 8 notification categories + a
// Defaults row, plus the emergency-override toggle. SMS is omitted (no SMS
// sender — S9 FLAG 1); the sms keys are preserved untouched because we clone
// and write back the WHOLE notification_channels jsonb (read-modify-write, so
// sibling keys + sms survive). Pessimistic Save via onSave (os.save).

const CATEGORIES = [
  ['briefing', 'Briefing'], ['announcement', 'Announcement'], ['chat_mention', 'Chat mention'],
  ['ride_request', 'Ride request'], ['rsvp_reminder', 'RSVP reminder'], ['schedule_change', 'Schedule change'],
  ['score_published', 'Score published'], ['volunteer_opportunity', 'Volunteer'],
];
const HEAD = { fontSize: 10, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--as-text-secondary)' };

export default function ChannelMatrixForm({ open, onClose, initial, onSave, saving }) {
  return (
    <FullScreenForm open={open} onClose={onClose} title="Channels">
      <Body initial={initial} onSave={onSave} saving={saving} onClose={onClose} />
    </FullScreenForm>
  );
}

function Body({ initial, onSave, saving, onClose }) {
  const [nc, setNc] = useState(() => JSON.parse(JSON.stringify(initial.channels || {})));
  const defaults = nc.defaults || {};
  const perCat = nc.per_category || {};

  const setDefault = (ch, val) => setNc((p) => ({ ...p, defaults: { ...(p.defaults || {}), [ch]: val } }));
  const setCat = (cat, ch, val) => setNc((p) => ({
    ...p, per_category: { ...(p.per_category || {}), [cat]: { ...((p.per_category || {})[cat] || {}), [ch]: val } },
  }));

  const submit = async () => {
    const res = await onSave({ notification_channels: nc });
    if (res?.ok) onClose();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 600, margin: '0 auto' }}>
      <div style={{ backgroundColor: 'var(--as-bg-card)', border: '1px solid var(--as-border-default)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '9px 12px', backgroundColor: 'var(--as-bg-secondary)', borderBottom: '1px solid var(--as-border-default)' }}>
          <span style={{ ...HEAD, flex: 1 }}>Category</span>
          <span style={{ ...HEAD, width: 56, textAlign: 'center' }}>Push</span>
          <span style={{ ...HEAD, width: 56, textAlign: 'center' }}>Email</span>
        </div>
        <ChannelMatrixRow
          label="Default" isDefault push={!!defaults.push} email={!!defaults.email}
          onPush={(v) => setDefault('push', v)} onEmail={(v) => setDefault('email', v)}
        />
        {CATEGORIES.map(([key, label]) => (
          <ChannelMatrixRow
            key={key} label={label}
            push={!!perCat[key]?.push} email={!!perCat[key]?.email}
            onPush={(v) => setCat(key, 'push', v)} onEmail={(v) => setCat(key, 'email', v)}
          />
        ))}
      </div>

      <div style={{ backgroundColor: 'var(--as-bg-card)', border: '1px solid var(--as-border-default)', borderRadius: 10, padding: '4px 12px' }}>
        <Toggle
          label="Emergency alerts bypass quiet hours"
          description="Critical messages send even during a family's quiet hours."
          checked={!!nc.emergency_override_bypasses_quiet_hours}
          onChange={(v) => setNc((p) => ({ ...p, emergency_override_bypasses_quiet_hours: v }))}
        />
      </div>

      <button
        type="button" onClick={submit} disabled={saving}
        className="w-full font-semibold as-press as-bounce-tap"
        style={{ minHeight: 44, borderRadius: 10, opacity: saving ? 0.6 : 1, backgroundColor: 'var(--as-accent)', color: 'var(--as-text-inverse)', fontSize: 15 }}
      >
        {saving ? 'Saving…' : 'Save'}
      </button>
    </div>
  );
}

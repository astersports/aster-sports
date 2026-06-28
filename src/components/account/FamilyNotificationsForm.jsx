import { useState } from 'react';
import { Users } from 'lucide-react';
import FullScreenForm from '../shared/FullScreenForm';
import Toggle from '../shared/Toggle';

// Settings S2 — Family Notifications (parent self). Four toggles on
// guardian_notification_prefs (which family emails the parent receives — distinct
// from S1's notification CHANNELS). GUARDIAN-LEVEL: covers all the parent's players,
// not per-child. Defaults all-ON when a field is absent. Pessimistic save-and-close.
const FIELDS = [
  ['receive_weekly_digest', 'Weekly digest', 'One email a week with the week ahead for your players.'],
  ['receive_tournament_briefings', 'Tournament briefings', 'A briefing before each tournament weekend.'],
  ['receive_game_recaps', 'Game recaps', 'A recap after each game your player is on.'],
  ['receive_org_announcements', 'Org announcements', 'Program news from your club.'],
];

const WRAP = { display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 600, margin: '0 auto' };
const CTX = { display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--as-text-secondary)', backgroundColor: 'var(--as-info-soft)', border: '1px solid var(--as-border-default)', borderRadius: 10, padding: '10px 12px', lineHeight: 1.4 };
const CARD = { backgroundColor: 'var(--as-bg-card)', border: '1px solid var(--as-border-default)', borderRadius: 10, boxShadow: 'var(--as-shadow-sm)', padding: '4px 12px' };
const DIVIDER = { height: 1, backgroundColor: 'var(--as-border-subtle)', margin: '4px 0' };
const SAVE = { minHeight: 44, borderRadius: 10, backgroundColor: 'var(--as-accent)', color: 'var(--as-text-inverse)', fontSize: 15 };

export default function FamilyNotificationsForm({ open, onClose, initial, players, onSave, saving }) {
  return (
    <FullScreenForm open={open} onClose={onClose} title="Family notifications">
      <Body key={initial ? 'loaded' : 'pending'} initial={initial} players={players} onSave={onSave} saving={saving} onClose={onClose} />
    </FullScreenForm>
  );
}

function Body({ initial, players, onSave, saving, onClose }) {
  const [state, setState] = useState(() =>
    Object.fromEntries(FIELDS.map(([k]) => [k, initial?.[k] !== false])),
  );
  const submit = async () => {
    const res = await onSave(state);
    if (res?.ok) onClose();
  };
  return (
    <div style={WRAP}>
      {players ? (
        <div style={CTX}>
          <Users size={16} strokeWidth={1.9} aria-hidden="true" style={{ color: 'var(--as-accent)', flexShrink: 0 }} />
          <span>Applies to all your players: {players}.</span>
        </div>
      ) : null}
      <div style={CARD}>
        {FIELDS.map(([k, label, desc], i) => (
          <div key={k}>
            {i > 0 && <div style={DIVIDER} />}
            <Toggle label={label} description={desc} checked={state[k]} onChange={(v) => setState((s) => ({ ...s, [k]: v }))} />
          </div>
        ))}
      </div>
      <button type="button" onClick={submit} disabled={saving}
        className="w-full font-semibold as-press as-bounce-tap" style={{ ...SAVE, opacity: saving ? 0.6 : 1 }}>
        {saving ? 'Saving…' : 'Save'}
      </button>
    </div>
  );
}

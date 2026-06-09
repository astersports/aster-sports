import { useState } from 'react';
import FullScreenForm from '../shared/FullScreenForm';
import SegmentedControl from '../shared/SegmentedControl';
import { usePreferences } from '../../hooks/usePreferences';
import { useToast } from '../../context/useToast';

// Settings S1 (My Preferences). Writes user_preferences (self-RLS) via usePreferences.
// THEME SEGMENT HIDDEN per architect DR-1 ruling (2026-06-09): with no dark stylesheet/
// actuation, a live System/Light/Dark control is a no-op that lies (all render the same).
// The column + the persist path stay DORMANT (no schema change) so the future dark-mode
// arc can light it up. DENSITY stays — it is real, 2-STATE (minimal | maximum) per
// useDensity + §16.2 (a 'medium' write throws). card_density.default is a MERGED write —
// the per-page chip writes its own section key, so the two scopes never collide.
const DENSITY_OPTS = [
  { value: 'minimal', label: 'Minimal' },
  { value: 'maximum', label: 'Maximum' },
];
const VALID_DENSITY = ['minimal', 'maximum'];

const WRAP = { display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 600, margin: '0 auto' };
const LABEL = { fontSize: 11, fontWeight: 500, color: 'var(--as-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px 4px' };
const HELP = { fontSize: 13, color: 'var(--as-text-tertiary)', lineHeight: 1.4, margin: '8px 4px 0' };
const SAVE = { minHeight: 44, borderRadius: 10, backgroundColor: 'var(--as-accent)', color: 'var(--as-text-inverse)', fontSize: 15 };

export default function AppearanceForm({ open, onClose }) {
  return (
    <FullScreenForm open={open} onClose={onClose} title="Appearance">
      <Body onClose={onClose} />
    </FullScreenForm>
  );
}

function Body({ onClose }) {
  const { preferences, mergePreferenceJson } = usePreferences();
  const { showToast } = useToast();
  const storedDensity = preferences?.card_density?.default;
  const [density, setDensity] = useState(VALID_DENSITY.includes(storedDensity) ? storedDensity : 'minimal');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await mergePreferenceJson('card_density', { default: density });
      onClose();
    } catch {
      showToast("Couldn't save. Try again?", 'error');
    } finally { setSaving(false); }
  };

  return (
    <div style={WRAP}>
      <div>
        <p style={LABEL}>Default card density</p>
        <SegmentedControl label="Default card density" value={density} onChange={setDensity} options={DENSITY_OPTS} />
        <p style={HELP}>The starting density for cards. The per-page density chip still overrides it for that view.</p>
      </div>
      <button type="button" onClick={save} disabled={saving} className="w-full font-semibold as-press as-bounce-tap" style={{ ...SAVE, opacity: saving ? 0.6 : 1 }}>
        {saving ? 'Saving…' : 'Save'}
      </button>
    </div>
  );
}

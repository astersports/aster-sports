import { useId, useState } from 'react';
import FullScreenForm from '../shared/FullScreenForm';
import { usePreferences } from '../../hooks/usePreferences';
import { useToast } from '../../context/useToast';
import { US_TIMEZONES } from '../../lib/timezones';

// Settings S1 (My Preferences). timezone + locale → user_preferences (self-RLS),
// via the shared usePreferences store. Pessimistic save-and-close. NOTE (flagged):
// user-level timezone/locale ACTUATION is not yet wired everywhere — event times
// currently follow the org timezone, and i18n (locale) is Phase 3 (§16.6). S1 ships
// the pref UI + storage; actuation is sequenced separately.
const LOCALES = [['en-US', 'English (US)'], ['es-US', 'Español']];

const WRAP = { display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 600, margin: '0 auto' };
const LABEL = { display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--as-text-secondary)', marginBottom: 6 };
const SELECT = { width: '100%', minHeight: 44, padding: '0 12px', borderRadius: 10, border: '1.5px solid var(--as-border-default)', backgroundColor: 'var(--as-bg-tertiary)', color: 'var(--as-text-primary)', fontSize: 16, fontFamily: 'inherit' };
const HELP = { fontSize: 13, color: 'var(--as-text-tertiary)', lineHeight: 1.4, margin: '6px 4px 0' };
const SAVE = { minHeight: 44, borderRadius: 10, backgroundColor: 'var(--as-accent)', color: 'var(--as-text-inverse)', fontSize: 15 };

export default function TimeLanguageForm({ open, onClose }) {
  return (
    <FullScreenForm open={open} onClose={onClose} title="Time & language">
      <Body onClose={onClose} />
    </FullScreenForm>
  );
}

function Body({ onClose }) {
  const { preferences, updatePreference } = usePreferences();
  const { showToast } = useToast();
  const tzId = useId();
  const locId = useId();
  const [timezone, setTimezone] = useState(preferences?.timezone || 'America/New_York');
  const [locale, setLocale] = useState(preferences?.locale || 'en-US');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await updatePreference('timezone', timezone);
      await updatePreference('locale', locale);
      onClose();
    } catch {
      showToast("Couldn't save. Try again?", 'error');
    } finally { setSaving(false); }
  };

  return (
    <div style={WRAP}>
      <div>
        <label style={LABEL} htmlFor={tzId}>Time zone</label>
        <select id={tzId} value={timezone} onChange={(e) => setTimezone(e.target.value)} style={SELECT}>
          {US_TIMEZONES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <p style={HELP}>Used to show event times in your local zone.</p>
      </div>
      <div>
        <label style={LABEL} htmlFor={locId}>Language</label>
        <select id={locId} value={locale} onChange={(e) => setLocale(e.target.value)} style={SELECT}>
          {LOCALES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>
      <button type="button" onClick={save} disabled={saving} className="w-full font-semibold as-press as-bounce-tap" style={{ ...SAVE, opacity: saving ? 0.6 : 1 }}>
        {saving ? 'Saving…' : 'Save'}
      </button>
    </div>
  );
}

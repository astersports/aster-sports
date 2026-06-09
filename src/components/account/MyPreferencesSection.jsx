import { useState } from 'react';
import { ChevronRight, SlidersHorizontal } from 'lucide-react';
import Label from '../shared/Label';
import { usePreferences } from '../../hooks/usePreferences';
import { US_TIMEZONES } from '../../lib/timezones';
import AppearanceForm from './AppearanceForm';
import TimeLanguageForm from './TimeLanguageForm';

// Settings S1 — the "Preferences" group on /account (self, all roles). Two rows
// open focused forms (Appearance, Time & language). Summaries read the shared
// usePreferences store so they reflect saves immediately. Kept in its own component
// so AccountPage stays lean (≤150).
const CARD = { backgroundColor: 'var(--as-bg-card)', border: '1px solid var(--as-border-default)', borderRadius: 10, overflow: 'hidden' };
const ROW = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, width: '100%', minHeight: 56, padding: '0 14px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' };
const DIVIDER = { height: 1, backgroundColor: 'var(--as-border-subtle)', margin: '0 14px' };
const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);

function Row({ title, sub, onClick }) {
  return (
    <button type="button" className="as-press" style={ROW} onClick={onClick}>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: 15, color: 'var(--as-text-primary)', display: 'block' }}>{title}</span>
        <span style={{ fontSize: 13, color: 'var(--as-text-tertiary)', display: 'block', marginTop: 2 }}>{sub}</span>
      </span>
      <ChevronRight size={20} strokeWidth={1.75} aria-hidden="true" style={{ color: 'var(--as-text-tertiary)', flexShrink: 0 }} />
    </button>
  );
}

export default function MyPreferencesSection() {
  const { preferences } = usePreferences();
  const [openForm, setOpenForm] = useState(null);

  const density = ['minimal', 'maximum'].includes(preferences?.card_density?.default) ? preferences.card_density.default : 'minimal';
  const tzLabel = US_TIMEZONES.find(([v]) => v === preferences?.timezone)?.[1]?.split(' (')[0] || 'Eastern';
  const locale = preferences?.locale === 'es-US' ? 'Español' : 'English';

  return (
    <section style={{ marginBottom: 16 }}>
      <Label style={{ display: 'flex', alignItems: 'center', gap: 6 }}><SlidersHorizontal size={12} strokeWidth={2} /> Preferences</Label>
      <div style={CARD}>
        <Row title="Appearance" sub={`${cap(density)} density`} onClick={() => setOpenForm('appearance')} />
        <div style={DIVIDER} />
        <Row title="Time & language" sub={`${tzLabel} · ${locale}`} onClick={() => setOpenForm('time')} />
      </div>
      <AppearanceForm open={openForm === 'appearance'} onClose={() => setOpenForm(null)} />
      <TimeLanguageForm open={openForm === 'time'} onClose={() => setOpenForm(null)} />
    </section>
  );
}

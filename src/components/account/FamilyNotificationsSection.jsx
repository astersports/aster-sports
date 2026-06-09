import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import Label from '../shared/Label';
import { useAuth } from '../../context/AuthContext';
import { useGuardianNotificationPrefs } from '../../hooks/useGuardianNotificationPrefs';
import FamilyNotificationsForm from './FamilyNotificationsForm';

// Settings S2 — the parent-only "Family notifications" group on /account. Self-gates
// on isGuardian (RLS is the backstop); admin/coach non-guardians never see it.
const CARD = { backgroundColor: 'var(--as-bg-card)', border: '1px solid var(--as-border-default)', borderRadius: 10, overflow: 'hidden' };
const ROW = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, width: '100%', minHeight: 56, padding: '0 14px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' };
const KEYS = ['receive_weekly_digest', 'receive_tournament_briefings', 'receive_game_recaps', 'receive_org_announcements'];

export default function FamilyNotificationsSection() {
  const { myChildren } = useAuth();
  const { prefs, loading, saving, save, isGuardian } = useGuardianNotificationPrefs();
  const [open, setOpen] = useState(false);

  if (!isGuardian) return null;

  const onCount = prefs ? KEYS.filter((k) => prefs[k] !== false).length : 4;
  const names = (myChildren || []).map((c) => c.firstName).filter(Boolean).join(', ');
  const summary = loading ? 'Loading…' : `${onCount} of 4 on${names ? ` · ${names}` : ''}`;

  return (
    <section style={{ marginBottom: 16 }}>
      <Label>Family notifications</Label>
      <div style={CARD}>
        <button type="button" className="as-press" style={ROW} disabled={loading} onClick={() => setOpen(true)}>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: 15, color: 'var(--as-text-primary)', display: 'block' }}>Family emails</span>
            <span style={{ fontSize: 13, color: 'var(--as-text-tertiary)', display: 'block', marginTop: 2 }}>{summary}</span>
          </span>
          <ChevronRight size={20} strokeWidth={1.75} aria-hidden="true" style={{ color: 'var(--as-text-tertiary)', flexShrink: 0 }} />
        </button>
      </div>
      <FamilyNotificationsForm open={open} onClose={() => setOpen(false)} initial={prefs || {}} players={names} onSave={save} saving={saving} />
    </section>
  );
}

import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import AdminBackHeader from '../components/admin/AdminBackHeader';
import AutoNotificationSettingsForm from '../components/admin/AutoNotificationSettingsForm';
import { useOrgAutoNotifications } from '../hooks/useOrgAutoNotifications';

// /admin/settings — org-level admin settings. First section: Communications
// (the auto-notifications control surface that writes organizations.
// auto_notifications via the admin-gated RPC). Built as a real page per the
// 2026-06-09 mount sign-off; future org settings (e.g. pilot mode) get
// sections here.

const SECTION_LABEL = {
  fontSize: 11, fontWeight: 500, color: 'var(--as-text-tertiary)',
  textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 6px 4px',
};
const CARD = {
  backgroundColor: 'var(--as-bg-card)', border: '1px solid var(--as-border-default)',
  borderRadius: 10, boxShadow: 'var(--as-shadow-sm)', overflow: 'hidden',
};
const ROW = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
  width: '100%', minHeight: 56, padding: '0 16px', textAlign: 'left',
  background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
};

export default function AdminSettingsPage() {
  const { remindersOn, nudgesOn, minGoing, loading, saving, save } = useOrgAutoNotifications();
  const [open, setOpen] = useState(false);

  const summary = loading
    ? 'Loading…'
    : `Reminders ${remindersOn ? 'on' : 'off'} · Nudges ${nudgesOn ? 'on' : 'off'}`;

  return (
    <div className="px-4 py-4 as-fade-in" style={{ maxWidth: 600, margin: '0 auto' }}>
      <AdminBackHeader />
      <h1 className="font-bold" style={{ color: 'var(--as-text-primary)', fontSize: 20, marginBottom: 16 }}>
        Settings
      </h1>

      <p style={SECTION_LABEL}>Communications</p>
      <div style={CARD}>
        <button type="button" className="as-press" style={ROW} disabled={loading} onClick={() => setOpen(true)}>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: 15, color: 'var(--as-text-primary)', display: 'block' }}>Auto-notifications</span>
            <span style={{ fontSize: 13, color: 'var(--as-text-tertiary)', display: 'block', marginTop: 2 }}>{summary}</span>
          </span>
          <ChevronRight size={20} strokeWidth={1.75} aria-hidden="true" style={{ color: 'var(--as-text-tertiary)', flexShrink: 0 }} />
        </button>
      </div>

      <AutoNotificationSettingsForm
        open={open}
        onClose={() => setOpen(false)}
        initial={{ remindersOn, nudgesOn, minGoing }}
        onSave={save}
        saving={saving}
      />
    </div>
  );
}

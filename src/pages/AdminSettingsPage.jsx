import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AdminBackHeader from '../components/admin/AdminBackHeader';
import SettingsSheets from '../components/admin/SettingsSheets';
import { useOrgAutoNotifications } from '../hooks/useOrgAutoNotifications';
import { useOrgSettings } from '../hooks/useOrgSettings';
import { useAlertConfigs } from '../hooks/useAlertConfigs';

// /admin/settings — org-level admin settings (admin-only route). Thin row-list:
// each row opens a FullScreenForm from SettingsSheets. General + Communications +
// Pilot groups per the REV 2 spec. Decomposed at the Step-4 cap-pressure trigger.

const SECTION_LABEL = {
  fontSize: 11, fontWeight: 500, color: 'var(--as-text-tertiary)',
  textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 6px 4px',
};
const CARD = {
  backgroundColor: 'var(--as-bg-card)', border: '1px solid var(--as-border-default)',
  borderRadius: 10, boxShadow: 'var(--as-shadow-sm)', overflow: 'hidden', marginBottom: 20,
};
const ROW = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
  width: '100%', minHeight: 56, padding: '0 16px', textAlign: 'left',
  background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
};
const DIVIDER = { height: 1, backgroundColor: 'var(--as-border-subtle)', margin: '0 16px' };

function Row({ title, summary, disabled, onClick }) {
  return (
    <button type="button" className="as-press" style={ROW} disabled={disabled} onClick={onClick}>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: 15, color: 'var(--as-text-primary)', display: 'block' }}>{title}</span>
        <span style={{ fontSize: 13, color: 'var(--as-text-tertiary)', display: 'block', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{summary}</span>
      </span>
      <ChevronRight size={20} strokeWidth={1.75} aria-hidden="true" style={{ color: 'var(--as-text-tertiary)', flexShrink: 0 }} />
    </button>
  );
}

export default function AdminSettingsPage() {
  const { orgId, org } = useAuth();
  const an = useOrgAutoNotifications();
  const os = useOrgSettings(orgId);
  const al = useAlertConfigs();
  const [openForm, setOpenForm] = useState(null);
  const s = os.settings;

  const orgSummary = os.loading ? 'Loading…' : `${org?.name || 'Organization'} · ${s?.season_label || 'No season set'}`;
  const anSummary = an.loading ? 'Loading…' : `Reminders ${an.remindersOn ? 'on' : 'off'} · Nudges ${an.nudgesOn ? 'on' : 'off'}`;
  const senderSummary = os.loading ? 'Loading…' : (s?.from_name && s?.from_email ? `${s.from_name} · ${s.from_email}` : 'Not set');
  const channelsSummary = os.loading ? 'Loading…' : 'Push & email per category';
  const alertsSummary = al.loading ? 'Loading…' : `${al.configs.filter((c) => c.enabled).length} active · RSVP, briefings, data`;
  const pilotSummary = os.loading ? 'Loading…' : (s?.pilot_test_recipient_email ? `Redirecting to ${s.pilot_test_recipient_email}` : 'Live — sending to families');

  return (
    <div className="px-4 py-4 as-fade-in" style={{ maxWidth: 600, margin: '0 auto' }}>
      <AdminBackHeader />
      <h1 className="font-bold" style={{ color: 'var(--as-text-primary)', fontSize: 20, marginBottom: 16 }}>
        Settings
      </h1>

      <h2 style={SECTION_LABEL}>General</h2>
      <div style={CARD}>
        <Row title="Organization" summary={orgSummary} disabled={os.loading} onClick={() => setOpenForm('org')} />
      </div>

      <h2 style={SECTION_LABEL}>Notifications</h2>
      <div style={CARD}>
        <Row title="Automatic messages" summary={anSummary} disabled={an.loading} onClick={() => setOpenForm('autonotif')} />
        <div style={DIVIDER} />
        <Row title="Channels" summary={channelsSummary} disabled={os.loading} onClick={() => setOpenForm('channels')} />
        <div style={DIVIDER} />
        <Row title="Alerts" summary={alertsSummary} disabled={al.loading} onClick={() => setOpenForm('alerts')} />
      </div>

      <h2 style={SECTION_LABEL}>Communications</h2>
      <div style={CARD}>
        <Row title="Sender identity" summary={senderSummary} disabled={os.loading} onClick={() => setOpenForm('sender')} />
      </div>

      <h2 style={SECTION_LABEL}>Pilot</h2>
      <div style={CARD}>
        <Row title="Pilot mode" summary={pilotSummary} disabled={os.loading} onClick={() => setOpenForm('pilot')} />
      </div>
      <p style={{ fontSize: 12, color: 'var(--as-warning)', lineHeight: 1.4, margin: '0 4px 20px' }}>
        Clearing the test address sends real email to families — the go-live cutover.
      </p>

      <SettingsSheets openForm={openForm} setOpenForm={setOpenForm} an={an} os={os} al={al} org={org} />
    </div>
  );
}

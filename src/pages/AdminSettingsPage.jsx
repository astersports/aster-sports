import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AdminBackHeader from '../components/admin/AdminBackHeader';
import AutoNotificationSettingsForm from '../components/admin/AutoNotificationSettingsForm';
import SenderIdentityForm from '../components/admin/SenderIdentityForm';
import OrganizationForm from '../components/admin/OrganizationForm';
import { useOrgAutoNotifications } from '../hooks/useOrgAutoNotifications';
import { useOrgSettings } from '../hooks/useOrgSettings';

// /admin/settings — org-level admin settings. General group (Organization) +
// Communications group (Automatic messages via RPC, Sender identity direct).
// Future sections (Registration, Features, Pilot) add rows per the REV 2 spec.

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
  const [openForm, setOpenForm] = useState(null); // 'org' | 'autonotif' | 'sender' | null
  const s = os.settings;

  const orgSummary = os.loading ? 'Loading…' : `${org?.name || 'Organization'} · ${s?.season_label || 'No season set'}`;
  const anSummary = an.loading ? 'Loading…' : `Reminders ${an.remindersOn ? 'on' : 'off'} · Nudges ${an.nudgesOn ? 'on' : 'off'}`;
  const senderSummary = os.loading ? 'Loading…' : (s?.from_name && s?.from_email ? `${s.from_name} · ${s.from_email}` : 'Not set');

  return (
    <div className="px-4 py-4 as-fade-in" style={{ maxWidth: 600, margin: '0 auto' }}>
      <AdminBackHeader />
      <h1 className="font-bold" style={{ color: 'var(--as-text-primary)', fontSize: 20, marginBottom: 16 }}>
        Settings
      </h1>

      <p style={SECTION_LABEL}>General</p>
      <div style={CARD}>
        <Row title="Organization" summary={orgSummary} disabled={os.loading} onClick={() => setOpenForm('org')} />
      </div>

      <p style={SECTION_LABEL}>Communications</p>
      <div style={CARD}>
        <Row title="Automatic messages" summary={anSummary} disabled={an.loading} onClick={() => setOpenForm('autonotif')} />
        <div style={DIVIDER} />
        <Row title="Sender identity" summary={senderSummary} disabled={os.loading} onClick={() => setOpenForm('sender')} />
      </div>

      <OrganizationForm
        open={openForm === 'org'}
        onClose={() => setOpenForm(null)}
        initial={{ name: org?.name, mailingAddress: org?.mailing_address, seasonLabel: s?.season_label, timezone: s?.timezone }}
        onSave={os.save}
        saving={os.saving}
      />
      <AutoNotificationSettingsForm
        open={openForm === 'autonotif'}
        onClose={() => setOpenForm(null)}
        initial={{ remindersOn: an.remindersOn, nudgesOn: an.nudgesOn, minGoing: an.minGoing }}
        onSave={an.save}
        saving={an.saving}
      />
      <SenderIdentityForm
        open={openForm === 'sender'}
        onClose={() => setOpenForm(null)}
        initial={{ fromName: s?.from_name, fromEmail: s?.from_email, replyTo: s?.reply_to_email }}
        onSave={os.save}
        saving={os.saving}
      />
    </div>
  );
}

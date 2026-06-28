import { useMemo, useState } from 'react';
import { Bell, Building2, CalendarDays, FlaskConical, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AdminBackHeader from '../components/admin/AdminBackHeader';
import SettingsSheets from '../components/admin/SettingsSheets';
import { useOrgAutoNotifications } from '../hooks/useOrgAutoNotifications';
import { useOrgSettings } from '../hooks/useOrgSettings';
import { useAlertConfigs } from '../hooks/useAlertConfigs';
import { useOrgFeatureSettings } from '../hooks/useOrgFeatureSettings';
import { SEARCH_KEYWORDS } from '../components/admin-settings/settingsStyles';
import SettingsGroup from '../components/admin-settings/SettingsGroup';
import SettingsSearch from '../components/admin-settings/SettingsSearch';
import SettingsNoResults from '../components/admin-settings/SettingsNoResults';
import SettingsSavedBanner from '../components/admin-settings/SettingsSavedBanner';
import SettingsErrorNote from '../components/admin-settings/SettingsErrorNote';
import { useSaveTick } from '../components/admin-settings/useSaveTick';

// /admin/settings — org-level admin settings (admin-only route). Thin row-list:
// each row opens a FullScreenForm from SettingsSheets. L99 enhancement pass adds
// search, status badges, icons, skeletons, save feedback, and kind empty/error
// states; the row catalog + groups live in src/components/admin-settings/.
const onOff = (v) => ({ label: v ? 'On' : 'Off', tone: v ? 'on' : 'off' });

export default function AdminSettingsPage() {
  const { orgId, org } = useAuth();
  const an = useOrgAutoNotifications();
  const os = useOrgSettings(orgId);
  const al = useAlertConfigs();
  const fs = useOrgFeatureSettings();
  const [openForm, setOpenForm] = useState(null);
  const [query, setQuery] = useState('');
  const s = os.settings;

  // Wrap each hook's save so a success bumps the saved-confirmation tick.
  const { tick, wrapped } = useSaveTick([an, os, al, fs]);
  const [anW, osW, alW, fsW] = wrapped;

  const k = SEARCH_KEYWORDS;
  const open = (id) => () => setOpenForm(id);
  const activeAlerts = al.configs.filter((c) => c.enabled).length;
  // Settings finished loading but came back empty → derived load-error note.
  const loadError = !!orgId && !os.loading && !s;

  const groups = useMemo(() => [
    { label: 'General', icon: Building2, rows: [
      { id: 'org', title: 'Organization', icon: Building2, keywords: k.org, disabled: os.loading,
        summary: os.loading ? 'Loading…' : `${org?.name || 'Organization'} · ${s?.season_label || 'No season set'}`,
        loading: os.loading, onClick: open('org') },
    ] },
    { label: 'Notifications', icon: Bell, rows: [
      { id: 'autonotif', title: 'Automatic messages', icon: Bell, keywords: k.autonotif, disabled: an.loading,
        summary: an.loading ? 'Loading…' : `Reminders ${an.remindersOn ? 'on' : 'off'} · Nudges ${an.nudgesOn ? 'on' : 'off'}`,
        badge: an.loading ? null : onOff(an.remindersOn || an.nudgesOn), loading: an.loading, onClick: open('autonotif') },
      { id: 'channels', title: 'Channels', icon: Bell, keywords: k.channels, disabled: os.loading,
        summary: os.loading ? 'Loading…' : 'Push & email per category', loading: os.loading, onClick: open('channels') },
      { id: 'alerts', title: 'Alerts', icon: Bell, keywords: k.alerts, disabled: al.loading,
        summary: al.loading ? 'Loading…' : `${activeAlerts} active · RSVP, briefings, data`,
        badge: al.loading ? null : { label: `${activeAlerts} active`, tone: activeAlerts ? 'on' : 'off' },
        loading: al.loading, onClick: open('alerts') },
    ] },
    { label: 'Events', icon: CalendarDays, rows: [
      { id: 'features', title: 'Event features', icon: CalendarDays, keywords: k.features, disabled: fs.loading,
        summary: fs.loading ? 'Loading…' : `Rides ${fs.ridesOn ? 'on' : 'off'} · Volunteers ${fs.dutiesOn ? 'on' : 'off'}`,
        badge: fs.loading ? null : onOff(fs.ridesOn || fs.dutiesOn), loading: fs.loading, onClick: open('features') },
    ] },
    { label: 'Communications', icon: Send, rows: [
      { id: 'sender', title: 'Sender identity', icon: Send, keywords: k.sender, disabled: os.loading,
        summary: os.loading ? 'Loading…' : (s?.from_name && s?.from_email ? `${s.from_name} · ${s.from_email}` : 'Not set'),
        badge: os.loading ? null : { label: s?.from_name && s?.from_email ? 'Set' : 'Not set', tone: s?.from_name && s?.from_email ? 'on' : 'warn' },
        loading: os.loading, onClick: open('sender') },
    ] },
    { label: 'Pilot', icon: FlaskConical, rows: [
      { id: 'pilot', title: 'Pilot mode', icon: FlaskConical, keywords: k.pilot, disabled: os.loading,
        summary: os.loading ? 'Loading…' : (s?.pilot_test_recipient_email ? `Redirecting to ${s.pilot_test_recipient_email}` : 'Live — sending to families'),
        badge: os.loading ? null : (s?.pilot_test_recipient_email ? { label: 'Test mode', tone: 'warn' } : { label: 'Live', tone: 'on' }),
        loading: os.loading, onClick: open('pilot') },
    ] },
  ], [k, os.loading, an, al.loading, activeAlerts, fs, s, org?.name]);

  const q = query.trim().toLowerCase();
  const allRows = groups.flatMap((g) => g.rows);
  const matchCount = q
    ? allRows.filter((r) => `${r.title} ${r.summary} ${r.keywords || ''}`.toLowerCase().includes(q)).length
    : allRows.length;

  return (
    <div className="px-4 py-4 as-fade-in" style={{ maxWidth: 600, margin: '0 auto' }}>
      <AdminBackHeader />
      <h1 className="font-bold" style={{ color: 'var(--as-text-primary)', fontSize: 20, marginBottom: 16 }}>
        Settings
      </h1>

      <SettingsSavedBanner savedTick={tick} />
      {loadError ? <SettingsErrorNote /> : null}
      <SettingsSearch value={query} onChange={setQuery} resultCount={matchCount} totalCount={allRows.length} />

      {q && matchCount === 0 ? (
        <SettingsNoResults query={query} onClear={() => setQuery('')} />
      ) : (
        groups.map((g) => (
          <SettingsGroup key={g.label} label={g.label} icon={g.icon} rows={g.rows} query={query} />
        ))
      )}

      {(!q || k.pilot.includes(q) || 'pilot'.includes(q)) ? (
        <p style={{ fontSize: 12, color: 'var(--as-warning)', lineHeight: 1.4, margin: '0 4px 20px' }}>
          Clearing the test address sends real email to families — the go-live cutover.
        </p>
      ) : null}

      <SettingsSheets openForm={openForm} setOpenForm={setOpenForm} an={anW} os={osW} al={alW} fs={fsW} org={org} />
    </div>
  );
}

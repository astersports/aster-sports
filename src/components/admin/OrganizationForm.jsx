import { useId, useState } from 'react';
import FullScreenForm from '../shared/FullScreenForm';
import Input from '../shared/Input';
import { US_TIMEZONES } from '../../lib/timezones';

// Settings → General → Organization. Name + mailing address are READ-ONLY
// (organizations table, no UPDATE policy — full edit needs a future set_org_profile
// RPC, deferred to multi-tenant onboarding). season_label + timezone are bucket-A
// (organization_settings) and save via useOrgSettings. Pessimistic save-and-close.

const LABEL = { display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--as-text-secondary)', marginBottom: 4 };
const HELP = { fontSize: 13, color: 'var(--as-text-tertiary)', lineHeight: 1.4, margin: '0 4px' };
const RO_TAG = { fontSize: 10, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--as-text-tertiary)', backgroundColor: 'var(--as-bg-secondary)', padding: '2px 7px', borderRadius: 5 };
const RO_VALUE = { minHeight: 44, display: 'flex', alignItems: 'center', padding: '0 12px', borderRadius: 10, border: '1.5px solid var(--as-border-subtle)', backgroundColor: 'var(--as-bg-secondary)', color: 'var(--as-text-secondary)', fontSize: 15 };
const SELECT_STYLE = { width: '100%', minHeight: 44, padding: '0 12px', borderRadius: 10, border: '1.5px solid var(--as-border-default)', backgroundColor: 'var(--as-bg-tertiary)', color: 'var(--as-text-primary)', fontSize: 16, fontFamily: 'inherit' };

function ReadOnlyRow({ label, value }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={LABEL}>{label}</span>
        <span style={RO_TAG}>Read-only</span>
      </div>
      <div style={RO_VALUE}>{value || '—'}</div>
    </div>
  );
}

export default function OrganizationForm({ open, onClose, initial, onSave, saving }) {
  return (
    <FullScreenForm open={open} onClose={onClose} title="Organization">
      <Body initial={initial} onSave={onSave} saving={saving} onClose={onClose} />
    </FullScreenForm>
  );
}

function Body({ initial, onSave, saving, onClose }) {
  const tzId = useId();
  const [seasonLabel, setSeasonLabel] = useState(initial.seasonLabel || '');
  const [timezone, setTimezone] = useState(initial.timezone || 'America/New_York');

  const submit = async () => {
    const res = await onSave({ season_label: seasonLabel.trim() || null, timezone });
    if (res?.ok) onClose();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 600, margin: '0 auto' }}>
      <ReadOnlyRow label="Name" value={initial.name} />
      <ReadOnlyRow label="Mailing address" value={initial.mailingAddress} />
      <p style={HELP}>Mailing address appears in the legal footer of automated emails. Editing name and address arrives with multi-org onboarding.</p>
      <Input label="Season label" value={seasonLabel} style={{ fontSize: 16 }}
        onChange={(e) => setSeasonLabel(e.target.value)} placeholder="Spring 2026" />
      <div>
        <label style={LABEL} htmlFor={tzId}>Time zone</label>
        <select id={tzId} value={timezone} onChange={(e) => setTimezone(e.target.value)} style={SELECT_STYLE}>
          {US_TIMEZONES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>
      <button
        type="button"
        onClick={submit}
        disabled={saving}
        className="w-full font-semibold as-press as-bounce-tap"
        style={{
          minHeight: 44, borderRadius: 10, opacity: saving ? 0.6 : 1,
          backgroundColor: 'var(--as-accent)', color: 'var(--as-text-inverse)', fontSize: 15,
        }}
      >
        {saving ? 'Saving…' : 'Save'}
      </button>
    </div>
  );
}

import { useState } from 'react';
import FullScreenForm from '../shared/FullScreenForm';
import AlertSettingsRow from './AlertSettingsRow';
import { alertLabel, alertSeverity, groupAlerts } from '../../lib/alertLabels';

// S9 Alerts: the 11 seeded alert_configurations grouped by type, each with an
// enabled toggle. Thresholds render read-only (S9 FLAG 2). Pessimistic Save
// diffs the local enabled map against the seed and UPDATEs only changed rows.

const GROUP_LABEL = {
  fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
  color: 'var(--as-text-secondary)', margin: '4px 4px 7px',
};
const CARD = {
  backgroundColor: 'var(--as-bg-card)', border: '1px solid var(--as-border-default)',
  borderRadius: 12, overflow: 'hidden', marginBottom: 16,
};

export default function AlertSettingsForm({ open, onClose, configs, onSave, saving }) {
  return (
    <FullScreenForm open={open} onClose={onClose} title="Alerts">
      <Body configs={configs} onSave={onSave} saving={saving} onClose={onClose} />
    </FullScreenForm>
  );
}

function Body({ configs, onSave, saving, onClose }) {
  const [enabledMap, setEnabledMap] = useState(() => Object.fromEntries(configs.map((c) => [c.id, c.enabled])));
  const groups = groupAlerts(configs);
  const toggle = (id) => setEnabledMap((p) => ({ ...p, [id]: !p[id] }));

  const submit = async () => {
    const updates = configs
      .filter((c) => enabledMap[c.id] !== c.enabled)
      .map((c) => ({ id: c.id, enabled: enabledMap[c.id] }));
    if (!updates.length) { onClose(); return; }
    const res = await onSave(updates);
    if (res?.ok) onClose();
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      {groups.map((g) => (
        <div key={g.title}>
          <p style={GROUP_LABEL}>{g.title}</p>
          <div style={CARD}>
            {g.rows.map((c) => {
              const { label, summary } = alertLabel(c.type_key, c.instance_key);
              return (
                <AlertSettingsRow
                  key={c.id}
                  severity={alertSeverity(c.threshold_config, c.default_severity)}
                  label={label} summary={summary}
                  enabled={!!enabledMap[c.id]} onToggle={() => toggle(c.id)}
                />
              );
            })}
          </div>
        </div>
      ))}
      <p style={{ fontSize: 11, color: 'var(--as-text-tertiary)', textAlign: 'center', margin: '0 0 14px' }}>
        Thresholds are set in season config. Disabling an alert stops it from firing.
      </p>
      <button
        type="button" onClick={submit} disabled={saving}
        className="w-full font-semibold as-press as-bounce-tap"
        style={{ minHeight: 44, borderRadius: 10, opacity: saving ? 0.6 : 1, backgroundColor: 'var(--as-accent)', color: 'var(--as-text-inverse)', fontSize: 15 }}
      >
        {saving ? 'Saving…' : 'Save'}
      </button>
    </div>
  );
}

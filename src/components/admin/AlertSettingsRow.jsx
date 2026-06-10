// One row of the S9 Alerts list: a severity dot + label + read-only threshold
// summary + an enabled switch. Thresholds are display-only in the pilot
// (S9 FLAG 2) — there is no threshold editor here.
const SEV_COLOR = { warn: 'var(--as-warning)', crit: 'var(--as-danger)', info: 'var(--as-info)' };

function Switch({ checked, onChange, label }) {
  return (
    <button
      type="button" role="switch" aria-checked={checked} aria-label={label}
      onClick={() => onChange(!checked)} className="as-press"
      style={{
        width: 42, height: 25, borderRadius: 13, padding: 2, flexShrink: 0, border: 'none', cursor: 'pointer',
        backgroundColor: checked ? 'var(--as-success)' : 'var(--as-bg-tertiary)', display: 'flex', alignItems: 'center',
      }}
    >
      <span style={{
        width: 19, height: 19, borderRadius: 9999, backgroundColor: 'var(--as-text-inverse)',
        transform: checked ? 'translateX(17px)' : 'translateX(0)', transition: 'transform 0.2s', boxShadow: 'var(--as-shadow-sm)',
      }} />
    </button>
  );
}

export default function AlertSettingsRow({ severity, label, summary, enabled, onToggle }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 12px', borderBottom: '1px solid var(--as-border-subtle)' }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, backgroundColor: SEV_COLOR[severity] || SEV_COLOR.warn }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--as-text-primary)' }}>{label}</div>
        {summary && <div style={{ fontSize: 11.5, color: 'var(--as-text-tertiary)', marginTop: 1 }}>{summary}</div>}
      </div>
      <Switch checked={enabled} onChange={onToggle} label={`Enable ${label}`} />
    </div>
  );
}

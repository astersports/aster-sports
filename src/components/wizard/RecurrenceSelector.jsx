import { chipStyle, controlStyle } from './wizardStyles';

const PATTERNS = [
  { key: 'once', label: 'One time' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'biweekly', label: 'Every 2 weeks' },
];

export default function RecurrenceSelector({ value, onChange }) {
  const pattern = value?.pattern || 'once';
  const until = value?.until || '';

  const setPattern = (newPattern) => {
    onChange({ pattern: newPattern, until: newPattern === 'once' ? null : until });
  };

  const setUntil = (newUntil) => onChange({ pattern, until: newUntil });

  return (
    <div>
      <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--as-text-secondary)', marginBottom: 6, display: 'block' }}>
        Repeat
      </span>
      <div style={{ display: 'flex', gap: 8, marginBottom: pattern !== 'once' ? 12 : 0 }}>
        {PATTERNS.map((p) => (
          <button key={p.key} type="button" onClick={() => setPattern(p.key)}
            className="as-press" style={chipStyle(pattern === p.key, { flex: 1, padding: '0 12px' })}>
            {p.label}
          </button>
        ))}
      </div>
      {pattern !== 'once' && (
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--as-text-secondary)' }}>Until</span>
          <input type="date" value={until || ''} onChange={(e) => setUntil(e.target.value)}
            style={controlStyle} />
        </label>
      )}
    </div>
  );
}

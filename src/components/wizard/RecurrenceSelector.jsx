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
      <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--em-text-secondary)', marginBottom: 6, display: 'block' }}>
        Repeat
      </span>
      <div style={{ display: 'flex', gap: 8, marginBottom: pattern !== 'once' ? 12 : 0 }}>
        {PATTERNS.map((p) => (
          <button key={p.key} type="button" onClick={() => setPattern(p.key)}
            className="sf-press" style={chipStyle(pattern === p.key)}>
            {p.label}
          </button>
        ))}
      </div>
      {pattern !== 'once' && (
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--em-text-secondary)' }}>Until</span>
          <input type="date" value={until || ''} onChange={(e) => setUntil(e.target.value)}
            style={inputStyle} />
        </label>
      )}
    </div>
  );
}

const chipStyle = (sel) => ({
  flex: 1, minHeight: 40, borderRadius: 10,
  border: sel ? '2px solid var(--em-accent)' : '1px solid var(--em-border-default)',
  backgroundColor: sel ? 'var(--em-accent)' : 'var(--em-bg-card)',
  color: sel ? 'var(--em-text-inverse)' : 'var(--em-text-primary)',
  fontSize: 13, fontWeight: 500, padding: '0 12px',
});

const inputStyle = {
  minHeight: 44, borderRadius: 10, border: '1px solid var(--em-border-default)',
  backgroundColor: 'var(--em-bg-card)', padding: '0 12px', fontSize: 15,
  color: 'var(--em-text-primary)', width: '100%',
};

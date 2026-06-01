// Shared form primitives for the registration wizard. Matches the locked design system
// (CLAUDE.md §7): inputs 44px tall, var(--em-bg-tertiary) bg, 1.5px border, 10px radius,
// accent focus ring. Keeps the step components small (≤150-line cap).

const inputStyle = {
  width: '100%', minHeight: 44, padding: '0 12px', boxSizing: 'border-box',
  backgroundColor: 'var(--em-bg-tertiary)', border: '1.5px solid var(--em-border-default)',
  borderRadius: 10, fontSize: 15, color: 'var(--em-text-primary)', outline: 'none',
};
const labelStyle = {
  display: 'block', fontSize: 11, fontWeight: 500, textTransform: 'uppercase',
  letterSpacing: '0.05em', color: 'var(--em-text-tertiary)', margin: '0 0 4px',
};

export function Field({ label, htmlFor, children }) {
  return (
    <div style={{ marginBottom: 12 }}>
      {label && <label htmlFor={htmlFor} style={labelStyle}>{label}</label>}
      {children}
    </div>
  );
}

export function TextInput({ id, value, onChange, type = 'text', placeholder, autoComplete }) {
  return (
    <input
      id={id} type={type} value={value || ''} placeholder={placeholder} autoComplete={autoComplete}
      onChange={(e) => onChange(e.target.value)} style={inputStyle}
    />
  );
}

export function SelectInput({ id, value, onChange, options }) {
  return (
    <select id={id} value={value || ''} onChange={(e) => onChange(e.target.value)} style={inputStyle}>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

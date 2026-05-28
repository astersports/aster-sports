export default function Toggle({ label, checked, onChange, description }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label}
      onClick={() => onChange(!checked)} className="em-press" style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%',
      minHeight: 44, padding: '0 4px', cursor: 'pointer', background: 'none', border: 'none', fontFamily: 'inherit',
      textAlign: 'left',
    }}>
      <div style={{ flex: 1, minWidth: 0, marginRight: 12 }}>
        <span style={{ fontSize: 15, color: 'var(--em-text-primary)', display: 'block' }}>{label}</span>
        {description && (
          <span style={{ fontSize: 13, color: 'var(--em-text-tertiary)', display: 'block', marginTop: 2, lineHeight: 1.4 }}>
            {description}
          </span>
        )}
      </div>
      <div style={{
        width: 48, height: 28, borderRadius: 14, padding: 2, flexShrink: 0,
        backgroundColor: checked ? 'var(--em-accent)' : 'var(--em-bg-tertiary)',
        transition: 'background-color 0.2s', display: 'flex', alignItems: 'center',
      }}>
        <div style={{
          width: 24, height: 24, borderRadius: 9999, backgroundColor: 'var(--em-text-inverse)',
          transform: checked ? 'translateX(20px)' : 'translateX(0)',
          transition: 'transform 0.2s', boxShadow: 'var(--em-shadow-sm)',
        }} />
      </div>
    </button>
  );
}

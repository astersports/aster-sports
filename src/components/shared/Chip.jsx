export default function Chip({ label, active, color, onClick }) {
  return (
    <button
      type="button"
      onClick={() => { navigator.vibrate?.(10); onClick(); }}
      className="sf-press"
      style={{
        flexShrink: 0,
        minHeight: 32,
        padding: '0 12px',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: active ? 600 : 400,
        border: `1.5px solid ${active ? (color || 'var(--em-accent)') : 'var(--em-border-default)'}`,
        backgroundColor: active ? (color ? `${color}15` : 'var(--em-accent-soft)') : 'var(--em-bg-card)',
        color: active ? (color || 'var(--em-accent)') : 'var(--em-text-primary)',
        whiteSpace: 'nowrap',
        fontFamily: 'inherit',
      }}
    >
      {label}
    </button>
  );
}

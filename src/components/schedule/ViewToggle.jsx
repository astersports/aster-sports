export default function ViewToggle({ value, onChange }) {
  return (
    <div className="flex" role="tablist" aria-label="Schedule view" style={{ backgroundColor: 'var(--em-bg-secondary)', borderRadius: 999, padding: 2 }}>
      <ToggleButton label="All" active={value === 'all'} onClick={() => onChange('all')} />
      <ToggleButton label="Games" active={value === 'games'} onClick={() => onChange('games')} />
    </div>
  );
}

function ToggleButton({ label, active, onClick }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={() => { navigator.vibrate?.(10); onClick(); }}
      className="em-press"
      style={{
        padding: '0 16px', minHeight: 44, borderRadius: 999, fontSize: 13, fontWeight: active ? 600 : 400,
        border: 'none', backgroundColor: active ? 'var(--em-bg-card)' : 'transparent',
        color: active ? 'var(--em-text-primary)' : 'var(--em-text-tertiary)',
        boxShadow: active ? 'var(--em-shadow-sm)' : 'none', cursor: 'pointer', fontFamily: 'inherit',
      }}
    >
      {label}
    </button>
  );
}

export default function FilterSelect({ value, onChange, options, ariaLabel }) {
  const active = options.find((o) => o.value === value);
  const color = active?.color;
  return (
    <select
      value={value ?? ''}
      onChange={(e) => { navigator.vibrate?.(10); onChange(e.target.value || null); }}
      aria-label={ariaLabel}
      style={{
        minHeight: 36,
        padding: '0 26px 0 10px',
        borderRadius: 8,
        fontSize: 13,
        fontWeight: 500,
        width: 'auto',
        maxWidth: '100%',
        border: `1.5px solid ${color || 'var(--em-border-default)'}`,
        backgroundColor: color ? `${color}15` : 'var(--em-bg-card)',
        color: color || 'var(--em-text-primary)',
        fontFamily: 'inherit',
        appearance: 'none',
        WebkitAppearance: 'none',
        backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M3 4.5l3 3 3-3' fill='none' stroke='%238896AB' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")",
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 10px center',
        backgroundSize: '12px',
      }}
    >
      {options.map((o) => (
        <option key={o.value ?? '__all'} value={o.value ?? ''}>{o.label}</option>
      ))}
    </select>
  );
}

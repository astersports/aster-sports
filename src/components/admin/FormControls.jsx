// Tiny building blocks for the admin CRUD sheets. Kept separate so the
// admin form sheets don't each reinvent the same input styles —
// everything that writes to --as-* tokens lives here.

export function Field({ label, children, required }) {
  return (
    <div className="mb-3">
      <div style={{ color: 'var(--as-text-secondary)', fontSize: 13, marginBottom: 6 }}>
        {label}
        {required && <span style={{ color: 'var(--as-danger)', marginLeft: 4 }} aria-hidden="true">*</span>}
      </div>
      {children}
    </div>
  );
}

export function Input({ value, onChange, placeholder, type = 'text' }) {
  return (
    <input
      type={type}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: '100%',
        minHeight: 44,
        padding: '0 14px',
        borderRadius: 10,
        border: '1px solid var(--as-border-default)',
        backgroundColor: 'var(--as-bg-card)',
        color: 'var(--as-text-primary)',
        fontSize: 15,
        outline: 'none',
      }}
    />
  );
}

// Radio-style chip row for single-value selectors (age group, gender,
// competition type, day of week, etc.). `options` is an array of
// { key, label }; the key is what gets persisted.
export function ChipField({ label, options, value, onChange, required }) {
  return (
    <Field label={label} required={required}>
      <div className="flex flex-wrap gap-2">
        {options.map(({ key, label: optLabel }) => {
          const active = value === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange(key)}
              className="as-press"
              style={{
                minHeight: 44,
                padding: '0 16px',
                borderRadius: 999,
                fontSize: 13,
                border: `1px solid ${active ? 'var(--as-accent)' : 'var(--as-border-default)'}`,
                backgroundColor: active ? 'var(--as-accent-soft)' : 'var(--as-bg-card)',
                color: active ? 'var(--as-accent)' : 'var(--as-text-primary)',
                fontWeight: 500,
              }}
              aria-pressed={active}
            >
              {optLabel}
            </button>
          );
        })}
      </div>
    </Field>
  );
}

import { forwardRef, useId } from 'react';

const Input = forwardRef(function Input({ label, error, style, ...props }, ref) {
  const id = useId();
  return (
    <div>
      {label && (
        <label htmlFor={id} style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--em-text-secondary)', marginBottom: 4 }}>
          {label}
        </label>
      )}
      <input
        id={id}
        ref={ref}
        style={{
          width: '100%',
          minHeight: 44,
          padding: '0 12px',
          borderRadius: 10,
          border: `1.5px solid ${error ? 'var(--em-danger)' : 'var(--em-border-default)'}`,
          backgroundColor: 'var(--em-bg-tertiary)',
          color: 'var(--em-text-primary)',
          fontSize: 15,
          fontFamily: 'inherit',
          ...style,
        }}
        {...props}
      />
      {error && (
        <div style={{ fontSize: 11, color: 'var(--em-danger)', marginTop: 4 }}>{error}</div>
      )}
    </div>
  );
});

export default Input;

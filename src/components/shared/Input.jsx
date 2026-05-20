import { forwardRef, useId } from 'react';

// L99 v6 §5.2 C3 — Frank's call 2026-05-20: adopt the red asterisk
// pattern from PR #350 (ScheduleChangeComposer opponent field) on
// every required field across admin forms. `required` prop renders
// a red `*` next to the label and sets aria-required + native HTML5
// required on the input. Optional fields stay unmarked.
const Input = forwardRef(function Input({ label, error, style, required, ...props }, ref) {
  const id = useId();
  return (
    <div>
      {label && (
        <label htmlFor={id} style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--em-text-secondary)', marginBottom: 4 }}>
          {label}
          {required && <span style={{ color: 'var(--em-danger)', marginLeft: 4 }} aria-hidden="true">*</span>}
        </label>
      )}
      <input
        id={id}
        ref={ref}
        aria-required={required || undefined}
        required={required}
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

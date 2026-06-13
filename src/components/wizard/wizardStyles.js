// Shared style helpers for the create/edit wizard steps. Centralizes what
// were three near-identical chipStyle copies (StepWhen / StepDetails /
// RecurrenceSelector) and the duplicated select/textarea blocks, per the
// events-wizard L99 audit 2026-06-13 (A11/A12/A15/D3 — AP#7 one-source).

// Selectable pill. Common shell (40px tap, 10px radius, accent-on-select);
// per-callsite specifics (flex / minWidth / fontSize / padding) via opts so
// every prior call site keeps byte-identical output.
export const chipStyle = (selected, { flex, minWidth, fontSize = 13, padding } = {}) => ({
  ...(flex != null && { flex }),
  ...(minWidth != null && { minWidth }),
  minHeight: 40, borderRadius: 10,
  border: selected ? '2px solid var(--as-accent)' : '1px solid var(--as-border-default)',
  backgroundColor: selected ? 'var(--as-accent)' : 'var(--as-bg-card)',
  color: selected ? 'var(--as-text-inverse)' : 'var(--as-text-primary)',
  fontSize, fontWeight: 500,
  ...(padding != null && { padding }),
});

// Field label (the small secondary-grey caption above selects/textareas).
export const fieldLabelStyle = { fontSize: 13, fontWeight: 500, color: 'var(--as-text-secondary)' };

// Native <select> / <input list> control — standardized on the shared
// <Input> convention (44px, tertiary bg, 1.5px border, 12px pad). This is the
// conformance standardization (RecurrenceSelector + the tournament select were
// 14px pad; aligned to 12px to match Input/the rest of the form).
export const controlStyle = {
  width: '100%', minHeight: 44, borderRadius: 10,
  border: '1.5px solid var(--as-border-default)',
  backgroundColor: 'var(--as-bg-tertiary)', padding: '0 12px',
  fontSize: 15, color: 'var(--as-text-primary)', fontFamily: 'inherit',
};

// Multiline note control (parent instructions / coach notes).
export const textareaStyle = (minHeight) => ({
  width: '100%', minHeight, padding: '10px 12px', borderRadius: 10,
  border: '1.5px solid var(--as-border-default)',
  backgroundColor: 'var(--as-bg-tertiary)', color: 'var(--as-text-primary)',
  fontSize: 15, fontFamily: 'inherit', resize: 'vertical',
});

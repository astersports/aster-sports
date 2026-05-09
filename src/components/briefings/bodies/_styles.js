// Shared inline styles for body editor inputs. Single source so each
// editor stays under the line ceiling.

export const labelStyle = { fontSize: 11, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--em-text-tertiary)', display: 'block', marginBottom: 6 };
export const inputStyle = { width: '100%', minHeight: 44, padding: '0 12px', borderRadius: 10, fontSize: 15, fontFamily: 'inherit', backgroundColor: 'var(--em-bg-tertiary)', border: '1.5px solid var(--em-border-default)', color: 'var(--em-text-primary)' };
export const textareaStyle = { ...inputStyle, padding: 10, minHeight: 96, resize: 'vertical' };
export const fieldGap = { display: 'flex', flexDirection: 'column', gap: 14 };

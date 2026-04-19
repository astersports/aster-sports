// Text-only empty state. Heading + message, centered, no illustration.
// Spec: heading 17px/600 primary, message 14px tertiary.
export default function TextEmptyState({ heading, message }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      textAlign: 'center', padding: '40px 16px', minHeight: 120,
    }}>
      {heading && (
        <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--sf-text-primary)', marginBottom: 6 }}>
          {heading}
        </div>
      )}
      {message && (
        <div style={{ fontSize: 14, color: 'var(--sf-text-tertiary)', maxWidth: 320, lineHeight: 1.5 }}>
          {message}
        </div>
      )}
    </div>
  );
}

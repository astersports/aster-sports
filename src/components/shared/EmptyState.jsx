// Friendly empty-state block — used when a list query returns zero rows.
// Icon is a Lucide component reference (not an element), so callers can
// pass e.g. `icon={Calendar}` and we size/stroke it consistently here.

export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div
      className="flex flex-col items-center justify-center text-center px-6 py-12"
      style={{ color: 'var(--sf-text-secondary)' }}
    >
      {Icon && (
        <div
          className="flex items-center justify-center mb-4"
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            backgroundColor: 'var(--sf-bg-secondary)',
            color: 'var(--sf-text-tertiary)',
          }}
        >
          <Icon size={24} strokeWidth={1.75} aria-hidden="true" />
        </div>
      )}
      {title && (
        <div
          className="font-semibold"
          style={{ color: 'var(--sf-text-primary)', fontSize: 16, marginBottom: 4 }}
        >
          {title}
        </div>
      )}
      {description && (
        <p style={{ fontSize: 14, maxWidth: 280, lineHeight: 1.5 }}>{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

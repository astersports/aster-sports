// Animated placeholder blocks shown while data loads. Variants cover the
// three shapes we actually use — card (full-width block with inner rows),
// list (horizontal row with avatar + text lines), text (a stack of lines).

function Bar({ width = '100%', height = 12, radius = 6, className = '' }) {
  return (
    <div
      className={`sf-pulse ${className}`}
      style={{
        width,
        height,
        borderRadius: radius,
        backgroundColor: 'var(--sf-bg-tertiary)',
      }}
    />
  );
}

function Card() {
  return (
    <div
      className="p-4 mb-3"
      style={{
        backgroundColor: 'var(--sf-bg-card)',
        borderRadius: 12,
        border: '1px solid var(--sf-border-subtle)',
      }}
    >
      <Bar width="40%" height={10} className="mb-3" />
      <Bar width="80%" height={16} className="mb-2" />
      <Bar width="60%" height={12} />
    </div>
  );
}

function ListRow() {
  return (
    <div className="flex items-center gap-3 py-3">
      <div
        className="sf-pulse"
        style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: 'var(--sf-bg-tertiary)' }}
      />
      <div className="flex-1">
        <Bar width="60%" height={12} className="mb-2" />
        <Bar width="40%" height={10} />
      </div>
    </div>
  );
}

function TextBlock() {
  return (
    <div className="py-1">
      <Bar width="90%" height={12} className="mb-2" />
      <Bar width="75%" height={12} className="mb-2" />
      <Bar width="50%" height={12} />
    </div>
  );
}

const VARIANTS = { card: Card, list: ListRow, text: TextBlock };

export default function LoadingSkeleton({ variant = 'card', count = 3 }) {
  const Cmp = VARIANTS[variant] || Card;
  return (
    <div aria-busy="true" aria-live="polite">
      {Array.from({ length: count }).map((_, i) => (
        <Cmp key={i} />
      ))}
    </div>
  );
}

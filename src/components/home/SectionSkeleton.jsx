// src/components/home/SectionSkeleton.jsx
// Phase 1 Step 5B: Skeleton variants that mirror real content shapes.
// Shape-matched skeletons (Linear/Stripe pattern) reduce perceived wait
// because the user sees the layout instantly and data fills the slots.

const BAR = { backgroundColor: 'var(--em-bg-secondary)', borderRadius: 4 };
const STRIPE = { width: 4, backgroundColor: 'var(--em-bg-tertiary)', flexShrink: 0 };

function PlainSkeleton({ rows }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {Array.from({ length: Math.max(1, rows) }).map((_, i) => (
        <div key={i} className="animate-pulse" aria-hidden="true"
          style={{ ...BAR, height: 88, borderRadius: 10, border: '1px solid var(--em-border-subtle)' }} />
      ))}
    </div>
  );
}

function CardSkeleton({ rows }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {Array.from({ length: Math.max(1, rows) }).map((_, i) => (
        <div key={i} aria-hidden="true"
          style={{ display: 'flex', backgroundColor: 'var(--em-bg-card)', borderRadius: 10, border: '1px solid var(--em-border-default)', overflow: 'hidden' }}>
          <div style={STRIPE} />
          <div className="animate-pulse" style={{ flex: 1, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ ...BAR, height: 10, width: '40%' }} />
            <div style={{ ...BAR, height: 18, width: '70%' }} />
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ ...BAR, height: 10, width: 80 }} />
              <div style={{ ...BAR, height: 10, width: 60 }} />
            </div>
            <div style={{ ...BAR, height: 10, width: '50%' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function KpiSkeleton() {
  return (
    <div className="animate-pulse" aria-hidden="true"
      style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i}
          style={{ backgroundColor: 'var(--em-bg-card)', borderRadius: 10, border: '1px solid var(--em-border-subtle)', padding: 14, display: 'flex', flexDirection: 'column', gap: 8, minHeight: 68 }}>
          <div style={{ ...BAR, height: 10, width: '60%' }} />
          <div style={{ ...BAR, height: 22, width: '40%' }} />
        </div>
      ))}
    </div>
  );
}

function RowSkeleton({ rows }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {Array.from({ length: Math.max(1, rows) }).map((_, i) => (
        <div key={i} className="animate-pulse" aria-hidden="true"
          style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', backgroundColor: 'var(--em-bg-card)', borderRadius: 8, border: '1px solid var(--em-border-subtle)' }}>
          <div style={{ ...BAR, height: 12, width: 56 }} />
          <div style={{ ...BAR, height: 12, width: '40%' }} />
          <div style={{ flex: 1 }} />
          <div style={{ ...BAR, height: 12, width: 40 }} />
        </div>
      ))}
    </div>
  );
}

export default function SectionSkeleton({ variant = 'plain', rows = 1 }) {
  if (variant === 'card') return <CardSkeleton rows={rows} />;
  if (variant === 'kpi') return <KpiSkeleton />;
  if (variant === 'row') return <RowSkeleton rows={1} />;
  if (variant === 'list') return <RowSkeleton rows={rows} />;
  return <PlainSkeleton rows={rows} />;
}

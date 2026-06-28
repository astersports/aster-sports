// E2: shape-matched loading skeleton for the public schedule page. Mirrors
// the header (org eyebrow + team title + accent rule) and three event-row
// placeholders so the layout doesn't jump when data lands. Animation rides
// the shared `as-pulse` class which already honors prefers-reduced-motion
// in index.css, so no extra reduced-motion guard is needed here.

const bar = (w, h) => ({
  width: w, height: h, borderRadius: 6,
  backgroundColor: 'var(--as-bg-tertiary)', margin: '0 auto',
});

function RowSkeleton() {
  return (
    <div style={{
      display: 'flex', alignItems: 'stretch', backgroundColor: 'var(--as-bg-card)',
      borderRadius: 10, border: '1px solid var(--as-border-default)',
      boxShadow: 'var(--as-shadow-sm)', overflow: 'hidden', marginBottom: 8,
    }}>
      <div style={{ width: 4, flexShrink: 0, backgroundColor: 'var(--as-bg-tertiary)' }} />
      <div style={{ flex: 1, padding: '12px 14px' }}>
        <div style={{ ...bar('40%', 13), margin: 0 }} />
        <div style={{ ...bar('70%', 15), margin: '8px 0 0' }} />
        <div style={{ ...bar('50%', 11), margin: '8px 0 0' }} />
      </div>
    </div>
  );
}

export default function PublicScheduleSkeleton() {
  return (
    <div
      className="as-pulse"
      aria-busy="true"
      aria-label="Loading schedule"
      style={{ maxWidth: 600, margin: '0 auto', padding: '16px 16px 80px', minHeight: '100vh' }}
    >
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ ...bar(120, 11), marginBottom: 8 }} />
        <div style={{ ...bar(200, 24), marginBottom: 8 }} />
        <div style={bar(32, 3)} />
        <div style={{ ...bar(160, 13), marginTop: 12 }} />
      </div>
      <RowSkeleton />
      <RowSkeleton />
      <RowSkeleton />
    </div>
  );
}

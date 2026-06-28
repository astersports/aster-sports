import { ChevronLeft, RefreshCw } from 'lucide-react';

// My Family page header (L99 enhancement). Sticky back + title + a refresh
// action that re-runs the parent-scoped reads optimistically (spinner shows
// immediately; aria-busy announces the in-flight state). --as-* tokens only.
export default function FamilyProgramsHeader({ onBack, onRefresh, refreshing }) {
  return (
    <div style={bar}>
      <button type="button" onClick={onBack} className="as-press" aria-label="Go back" style={back}>
        <ChevronLeft size={20} strokeWidth={1.75} /> Back
      </button>
      <button
        type="button"
        onClick={onRefresh}
        disabled={refreshing}
        className="as-press"
        aria-label="Refresh my family"
        aria-busy={refreshing || undefined}
        style={refresh}
      >
        <RefreshCw size={16} strokeWidth={2} className={refreshing ? 'as-spin' : undefined} aria-hidden="true" />
        {refreshing ? 'Refreshing…' : 'Refresh'}
      </button>
    </div>
  );
}

const bar = {
  position: 'sticky', top: 0, zIndex: 5,
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  backgroundColor: 'var(--as-bg-page)', padding: '4px 0 8px', marginBottom: 4,
};
const back = { display: 'flex', alignItems: 'center', minHeight: 44, padding: '0 8px 0 0', background: 'none', border: 'none', color: 'var(--as-accent)', fontSize: 15, fontWeight: 500 };
const refresh = { display: 'inline-flex', alignItems: 'center', gap: 6, minHeight: 44, padding: '0 4px', background: 'none', border: 'none', color: 'var(--as-text-secondary)', fontSize: 13, fontWeight: 600 };

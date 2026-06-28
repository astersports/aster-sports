import { RotateCw } from 'lucide-react';

// Actionable error state (L99 enhancement). Kindness microcopy (§16.3) + a
// real retry the parent can press, instead of a dead-end alert. The retry
// re-runs the parent-scoped reads (optimistic spinner via the parent's
// refreshing flag). role="alert" announces it to assistive tech. --as-* only.
export default function FamilyErrorState({ onRetry, retrying }) {
  return (
    <div role="alert" style={wrap}>
      <div style={msg}>Couldn’t load your family right now. Try again in a moment.</div>
      <button
        type="button"
        onClick={onRetry}
        disabled={retrying}
        className="as-press"
        aria-busy={retrying || undefined}
        style={btn}
      >
        <RotateCw size={16} strokeWidth={2.2} className={retrying ? 'as-spin' : undefined} aria-hidden="true" />
        {retrying ? 'Trying…' : 'Try again'}
      </button>
    </div>
  );
}

const wrap = { backgroundColor: 'var(--as-danger-soft)', border: '1px solid var(--as-danger-soft)', borderRadius: 13, padding: 16, textAlign: 'center' };
const msg = { fontSize: 14, fontWeight: 500, color: 'var(--as-danger)', lineHeight: 1.45 };
const btn = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, minHeight: 44, marginTop: 12, padding: '0 18px', backgroundColor: 'var(--as-danger)', color: 'var(--as-text-inverse)', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700 };

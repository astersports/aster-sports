// Header for /teams — title + season + live result count, plus an
// optional density toggle. Decomposed out of TeamsPage so the page stays
// thin (§6 zone-decomposition pattern). Presentational; all state flows
// from the page.
import { SlidersHorizontal } from 'lucide-react';

export default function TeamsListHeader({ seasonName, shown, total, density, onToggleDensity }) {
  // When a filter is active (shown < total) we surface "X of Y" so the
  // user sees the filter is doing something; otherwise just the count.
  const countLabel = shown === total ? `${total}` : `${shown} of ${total}`;
  const isCompact = density === 'minimal';
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 4 }}>
      <div style={{ minWidth: 0 }}>
        <h1 className="font-bold" style={{ color: 'var(--as-text-primary)', fontSize: 20, letterSpacing: '-0.025em' }}>
          Teams{' '}
          <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--as-text-tertiary)' }}>
            {seasonName || ''} · {countLabel}
          </span>
        </h1>
        <div style={{ width: 32, height: 3, borderRadius: 999, backgroundColor: 'var(--as-accent)', marginTop: 6 }} />
      </div>
      <button
        type="button"
        onClick={() => { navigator.vibrate?.(10); onToggleDensity?.(); }}
        aria-label={isCompact ? 'Show more detail per team' : 'Show less detail per team'}
        aria-pressed={!isCompact}
        title={isCompact ? 'Comfortable view' : 'Compact view'}
        className="as-press"
        style={{
          flexShrink: 0, width: 44, height: 44, display: 'flex', alignItems: 'center',
          justifyContent: 'center', borderRadius: 10, backgroundColor: 'var(--as-bg-card)',
          border: '1px solid var(--as-border-default)',
          color: isCompact ? 'var(--as-text-tertiary)' : 'var(--as-accent)',
        }}
      >
        <SlidersHorizontal size={20} strokeWidth={1.75} aria-hidden="true" />
      </button>
    </div>
  );
}

// Wave 4.4-B Session 5b — Step 1 kind picker, responsive grid rewrite.
// Replaces the prior vertical-row card list with a 2-col mobile /
// 3-col desktop tile grid (breakpoint at 600px viewport).
//
// External contract unchanged from prior wave: same { onPick, visibleKinds }
// props in, same SET_KIND + GO_FORWARD dispatch chain out via onPick(kind, meta).
//
// Usage fetch moved into useKindUsage hook (keeps this file ≤150 LOC).
// Tile presentation moved into KindTile component.

import { useEffect, useState } from 'react';
import { KIND_METADATA, sortKinds } from '../../lib/briefings/kindMetadata';
import { useKindUsage } from '../../hooks/useKindUsage';
import KindTile from './KindTile';

const DESKTOP_QUERY = '(min-width: 600px)';

const gridWrap = (cols) => ({
  display: 'grid',
  gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
  gap: 10,
});
const emptyState = {
  gridColumn: '1 / -1',
  textAlign: 'center', padding: '40px 16px',
  fontSize: 14, color: 'var(--em-text-tertiary)',
};

// matchMedia is jsdom-safe (returns matches:false by default) so this
// renders 2 cols in tests. Listener swaps to 3 cols when viewport
// crosses 600px in production.
function useColumns() {
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia(DESKTOP_QUERY).matches;
  });
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const mql = window.matchMedia(DESKTOP_QUERY);
    const handler = (e) => setIsDesktop(e.matches);
    mql.addEventListener?.('change', handler);
    return () => mql.removeEventListener?.('change', handler);
  }, []);
  return isDesktop ? 3 : 2;
}

export default function StepKindPicker({ onPick, visibleKinds = null }) {
  const { usageByKind, countsByKind } = useKindUsage();
  const cols = useColumns();

  const ordered = sortKinds(usageByKind).filter((k) => !visibleKinds || visibleKinds.includes(k));

  if (visibleKinds && visibleKinds.length === 0) {
    return (
      <div style={gridWrap(cols)} role="grid" aria-label="Briefing kinds">
        <div style={emptyState} role="row">
          No briefing types match this context.
        </div>
      </div>
    );
  }

  return (
    <div style={gridWrap(cols)} role="grid" aria-label="Briefing kinds">
      {ordered.map((k) => {
        const meta = KIND_METADATA[k];
        if (!meta) return null;
        return (
          <KindTile
            key={k}
            kind={k}
            meta={meta}
            usage={{ lastSentAt: usageByKind[k] || null, count: countsByKind[k] || 0 }}
            disabled={!!meta.disabled}
            onClick={(picked) => !meta.disabled && onPick(picked, meta)}
          />
        );
      })}
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';

// 2026-05-21 (Teams audit V5) — horizontal scroll affordance for the
// Pulse grid. At 414px iPhone width only ~6 date columns fit; users
// must swipe to see earlier events but had no visual cue that the grid
// scrolls. Right-edge fade gradient appears when content overflows and
// hides at the rightmost edge OR when content fits without scroll.
//
// Pure CSS gradient + scroll listener (Option A per audit prompt).
// Gradient sits in a positioned overlay with pointer-events:none so it
// never blocks the aria-label gridcells underneath (PR #428 a11y).
//
// Helper extracted from TeamHeatmap to keep that file under the 150-line
// CLAUDE.md ceiling (#11).
export default function TeamPulseScrollFade({ children }) {
  const ref = useRef(null);
  const [showFade, setShowFade] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const update = () => {
      const overflow = el.scrollWidth - el.clientWidth;
      const remaining = overflow - el.scrollLeft;
      // 4px tolerance — accounts for sub-pixel scroll positions when
      // scrolled to the rightmost edge.
      setShowFade(overflow > 4 && remaining > 4);
    };
    update();
    el.addEventListener('scroll', update, { passive: true });
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : null;
    if (ro) ro.observe(el);
    return () => {
      el.removeEventListener('scroll', update);
      if (ro) ro.disconnect();
    };
  }, []);

  return (
    <div style={{ position: 'relative' }}>
      <div ref={ref} style={{ overflowX: 'auto', padding: '0 16px 16px' }}>
        {children}
      </div>
      <div
        aria-hidden="true"
        style={{
          position: 'absolute', top: 0, right: 0, bottom: 16, width: 32,
          pointerEvents: 'none',
          background: 'linear-gradient(to right, transparent, var(--as-bg-page))',
          opacity: showFade ? 1 : 0,
          transition: 'opacity 150ms ease-out',
        }}
      />
    </div>
  );
}

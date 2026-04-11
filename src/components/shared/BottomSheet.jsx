import { useEffect, useState } from 'react';

// Mobile-native bottom sheet. Starts at `initialHeight` of the visual
// viewport; tapping the drag handle toggles to `expandedHeight`.
// Backdrop click or Escape dismisses.
//
// Height handling: `initialHeight`/`expandedHeight` are percentage
// strings like "85%". We measure `window.visualViewport.height` (with
// `window.innerHeight` as fallback) and compute the absolute pixel value
// ourselves instead of relying on CSS `%` or `dvh`. Why:
//   - CSS `%` inside `position: fixed; inset: 0` resolves against the
//     iOS layout viewport (tall, extends behind the URL bar), so the
//     bottom of the sheet gets cut off below the visible screen.
//   - CSS `dvh` fixes this on iOS 15.4+, but older Safari ignores it
//     silently, falling back to the broken percentage behavior.
//   - `window.visualViewport.height` is the authoritative visible
//     viewport and is supported back to iOS 13.
//
// BottomSheet returns null when closed so the inner <Sheet> unmounts
// and its useState resets to `expanded=false` on every reopen.
export default function BottomSheet({
  open,
  onClose,
  children,
  initialHeight = '40%',
  expandedHeight = '90%',
}) {
  if (!open) return null;
  return (
    <Sheet
      onClose={onClose}
      initialHeight={initialHeight}
      expandedHeight={expandedHeight}
    >
      {children}
    </Sheet>
  );
}

// "85%" → 0.85. Returns 0.4 for anything unparseable so tests/calls
// that pass garbage still get a visible sheet.
function parsePct(s) {
  if (typeof s !== 'string') return 0.4;
  const m = s.match(/^(\d+(?:\.\d+)?)%$/);
  return m ? Number(m[1]) / 100 : 0.4;
}

// Tracks the visible viewport height. Subscribes to visualViewport
// resize on modern browsers (iOS 13+, everything evergreen) and to
// window resize as a fallback. Intentionally does NOT listen to
// visualViewport `scroll` — on iOS that fires as the URL bar auto-
// hides, which would cause the sheet to resize mid-interaction.
function useVisualVh() {
  const read = () => {
    if (typeof window === 'undefined') return 800;
    return Math.round(window.visualViewport?.height ?? window.innerHeight);
  };
  const [vh, setVh] = useState(read);
  useEffect(() => {
    const update = () => setVh(read());
    const vv = window.visualViewport;
    vv?.addEventListener('resize', update);
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    return () => {
      vv?.removeEventListener('resize', update);
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
    };
  }, []);
  return vh;
}

function Sheet({ onClose, children, initialHeight, expandedHeight }) {
  const [expanded, setExpanded] = useState(false);
  const vh = useVisualVh();

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const pct = expanded ? parsePct(expandedHeight) : parsePct(initialHeight);
  const heightPx = Math.round(vh * pct);
  const maxHeightPx = Math.round(vh * 0.98);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full sf-sheet-rise flex flex-col"
        style={{
          height: `${heightPx}px`,
          maxHeight: `${maxHeightPx}px`,
          backgroundColor: 'var(--sf-bg-card)',
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          boxShadow: 'var(--sf-shadow-xl)',
          transition: 'height 250ms ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center justify-center sf-press"
          style={{ height: 24, width: '100%', flexShrink: 0 }}
          aria-label={expanded ? 'Collapse sheet' : 'Expand sheet'}
        >
          <span
            style={{
              width: 36, height: 4, borderRadius: 999,
              backgroundColor: 'var(--sf-border-strong)', marginTop: 8,
            }}
          />
        </button>
        {/* flex-1 + min-h-0 is the textbook flex-scroll pattern: without
            min-h-0 the flex child defaults to min-height: auto and refuses
            to shrink below its content, so overflow-y-auto never engages. */}
        <div
          className="flex-1 min-h-0 overflow-y-auto px-4 pb-4"
          style={{
            overscrollBehavior: 'contain',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

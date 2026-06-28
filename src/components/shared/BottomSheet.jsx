import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useVisualVh } from '../../hooks/useVisualVh';

// Mobile-native bottom sheet. Height is CONTENT-DRIVEN with a cap:
// the panel is a plain block container (NOT a flex container) that
// shrink-wraps its children — handle (44px block) + content region.
// The content region carries its own `max-height: cap - 44px` and
// `overflow-y: auto`, so short forms produce a short sheet with the
// Save button sitting flush against the content, and tall forms hit
// the cap and scroll inside the content region while the handle stays
// pinned. Tapping the handle toggles between `initialHeight` and
// `expandedHeight`. Backdrop click or Escape dismisses.
//
// Viewport handling: `initialHeight`/`expandedHeight` are percentage
// strings like "85%". We measure `window.visualViewport.height` (with
// `window.innerHeight` as fallback) and compute the cap in pixels
// ourselves instead of relying on CSS `%` or `dvh`. Why:
//   - CSS `%` inside `position: fixed; inset: 0` resolves against the
//     iOS layout viewport (tall, extends behind the URL bar), so caps
//     extend below the visible screen.
//   - CSS `dvh` fixes that on iOS 15.4+, but older Safari ignores it.
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

function Sheet({ onClose, children, initialHeight, expandedHeight }) {
  const [expanded, setExpanded] = useState(false);
  const vh = useVisualVh();
  const trapRef = useFocusTrap(true);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const HANDLE_PX = 44;
  const pct = expanded ? parsePct(expandedHeight) : parsePct(initialHeight);
  const maxHeightPx = Math.round(vh * pct);
  // Scroll region gets the cap minus the fixed handle row, so the
  // handle is always visible even when the content scrolls.
  const contentMaxHeightPx = Math.max(0, maxHeightPx - HANDLE_PX);

  // Portal to document.body so the sheet escapes <main>'s stacking context.
  // <main> is the iOS scroll container (-webkit-overflow-scrolling: touch), which
  // makes it a stacking context with z-index:auto; the fixed BottomNav (z-50, a
  // sibling of <main>) then paints ABOVE everything inside <main> — including this
  // sheet's z-[60] — covering the Save button. Portaling lifts the sheet out of
  // <main> into the root context, above the nav (same pattern as FullScreenForm).
  return createPortal(
    <div
      ref={trapRef}
      className="fixed inset-0 z-[60] flex items-end justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      {/* Panel is a plain block element — NO flex layout. Normal block
          flow sizes it to the sum of its children's natural heights
          (handle + content), capped by maxHeight. Short forms get a
          short sheet with zero dead space; tall forms hit the cap and
          the inner scroll region engages. `overflow: hidden` keeps the
          rounded corners from being clipped by the scrollable child. */}
      <div
        className="w-full as-sheet-rise"
        style={{
          maxHeight: `${maxHeightPx}px`,
          overflow: 'hidden',
          backgroundColor: 'var(--as-bg-card)',
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          boxShadow: 'var(--as-shadow-lg)',
          transition: 'max-height 250ms ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setExpanded((v) => !v)}
          className="as-press flex items-center justify-center"
          style={{ display: 'flex', width: '100%', height: HANDLE_PX }}
          aria-label={expanded ? 'Collapse sheet' : 'Expand sheet'}
        >
          <span
            style={{
              width: 36, height: 4, borderRadius: 999,
              backgroundColor: 'var(--as-border-default)',
            }}
          />
        </button>
        <div
          className="overflow-y-auto px-4 pb-4"
          style={{
            maxHeight: `${contentMaxHeightPx}px`,
            overscrollBehavior: 'contain',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}

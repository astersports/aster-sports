import { useEffect, useState } from 'react';

// Mobile-native bottom sheet. Starts at `initialHeight` of the visual
// viewport; tapping the drag handle toggles to `expandedHeight`.
// Backdrop click or Escape dismisses.
//
// Height units: pass values using `dvh` (dynamic visual viewport height)
// — e.g. "40dvh", "85dvh" — NOT percentages. `position: fixed; inset: 0`
// on iOS Safari sizes against the *layout* viewport which includes the
// area behind the URL bar, so percentage children can extend below the
// visible screen and the bottom of the form gets hidden under the fold.
// `dvh` units track the visible area and clip predictably.
//
// BottomSheet returns null when closed so the inner <Sheet> unmounts and
// its useState resets to `expanded=false` on every reopen — no effect-
// based reset needed.
export default function BottomSheet({
  open,
  onClose,
  children,
  initialHeight = '40dvh',
  expandedHeight = '90dvh',
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

function Sheet({ onClose, children, initialHeight, expandedHeight }) {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

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
          height: expanded ? expandedHeight : initialHeight,
          maxHeight: '95dvh',
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
              width: 36,
              height: 4,
              borderRadius: 999,
              backgroundColor: 'var(--sf-border-strong)',
              marginTop: 8,
            }}
          />
        </button>
        {/* flex-1 + min-h-0 is the textbook flex-scroll pattern: without
            min-h-0 the flex child defaults to min-height: auto and refuses
            to shrink below its content, so the overflow-y-auto would
            never actually engage. overscroll-behavior contains rubber-
            band so scrolling the form can't scroll the page behind it. */}
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

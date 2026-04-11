import { useEffect, useState } from 'react';

// Mobile-native bottom sheet. Starts at 40% viewport height; tapping the
// drag handle toggles to 90%. Backdrop click or Escape dismisses.
//
// The inner <Sheet> is keyed on `open` via conditional mount: when open
// flips to false the inner unmounts, and the next open mount starts fresh
// with `expanded=false` — no effect-based reset needed.
export default function BottomSheet({ open, onClose, children, initialHeight = '40%', expandedHeight = '90%' }) {
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
        className="w-full sf-sheet-rise"
        style={{
          height: expanded ? expandedHeight : initialHeight,
          maxHeight: '90vh',
          backgroundColor: 'var(--sf-bg-card)',
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          boxShadow: 'var(--sf-shadow-xl)',
          transition: 'height 250ms ease-out',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center justify-center sf-press"
          style={{ height: 24, width: '100%' }}
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
        <div className="flex-1 overflow-y-auto px-4 pb-4">{children}</div>
      </div>
    </div>
  );
}

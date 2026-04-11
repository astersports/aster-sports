import { useEffect } from 'react';

// Full-screen slide-up form overlay — the iOS-native pattern for any
// form that doesn't fit cleanly into a bottom sheet. Covers the entire
// visual viewport (including the notch area, padded with safe-area
// insets), renders a fixed header bar with Cancel + title, and gives
// the form body a scrollable content region below.
//
// Use this instead of BottomSheet for any non-trivial form (create/
// edit flows, multi-field inputs). BottomSheet is still the right
// shape for lightweight confirmations, filter pickers, and RSVP-style
// one-tap dialogs where a short sheet feels natural.
//
// Returns null when `open` is false so the children unmount and any
// internal form state resets on reopen.
export default function FullScreenForm({ open, onClose, title, children }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col sf-fade-in"
      style={{ backgroundColor: 'var(--sf-bg-page)' }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <header
        className="relative flex items-center"
        style={{
          flexShrink: 0,
          paddingTop: 'env(safe-area-inset-top, 0px)',
          minHeight: 'calc(56px + env(safe-area-inset-top, 0px))',
          backgroundColor: 'var(--sf-bg-card)',
          borderBottom: '1px solid var(--sf-border-subtle)',
        }}
      >
        <button
          type="button"
          onClick={onClose}
          className="sf-press"
          style={{
            minHeight: 44,
            padding: '0 16px',
            color: 'var(--sf-accent)',
            fontSize: 15,
            fontWeight: 500,
            background: 'none',
            border: 'none',
          }}
        >
          Cancel
        </button>
        {/* Absolutely centered so a long Cancel label on the left
            doesn't push the title off-center. Truncates at 60% of the
            header width so it can't collide with Cancel visually. */}
        <h2
          className="absolute font-semibold truncate"
          style={{
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, calc(-50% + env(safe-area-inset-top, 0px) / 2))',
            color: 'var(--sf-text-primary)',
            fontSize: 17,
            maxWidth: '60%',
            pointerEvents: 'none',
          }}
        >
          {title}
        </h2>
      </header>

      {/* The fixed parent gives this region a definite height, so the
          classic flex-1 + min-h-0 + overflow-y-auto pattern engages
          cleanly — tall forms scroll, short forms sit at the top. */}
      <div
        className="flex-1 min-h-0 overflow-y-auto px-4 py-4"
        style={{
          overscrollBehavior: 'contain',
          WebkitOverflowScrolling: 'touch',
          paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
        }}
      >
        {children}
      </div>
    </div>
  );
}

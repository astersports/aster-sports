import { Plus } from 'lucide-react';

// Floating action button for creating new events. Fixed position,
// bottom-right above the bottom nav. Must render outside any
// transform ancestor so position: fixed anchors to the viewport.

export default function ScheduleFab({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="sf-press sf-bounce-tap"
      aria-label="Create event"
      style={{
        position: 'fixed',
        bottom: 'calc(80px + env(safe-area-inset-bottom, 0px) + 8px)',
        right: 16,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'var(--em-accent)',
        color: 'var(--em-text-inverse)',
        border: 'none',
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        cursor: 'pointer',
      }}
    >
      <Plus size={24} strokeWidth={2} />
    </button>
  );
}

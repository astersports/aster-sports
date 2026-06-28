import { SearchX } from 'lucide-react';

// L99 SchedulePage enhancement #6: AP #63 same-concept divergence — when
// active filters hide every event the generic "No events this week" copy
// is a lie (events exist, the filters hide them). This distinct state
// names the real cause and offers the one useful action: clear filters.
// Kindness microcopy (§16.3); a polite live region announces the change.
export default function FilteredEmptyState({ onClearAll }) {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', padding: '28px 16px', gap: 10, minHeight: 120,
      }}
    >
      <span aria-hidden="true" style={{ color: 'var(--as-text-tertiary)' }}>
        <SearchX size={24} strokeWidth={1.75} />
      </span>
      <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--as-text-primary)' }}>
        Nothing matches those filters
      </div>
      <div style={{ fontSize: 14, color: 'var(--as-text-tertiary)', maxWidth: 320, lineHeight: 1.5 }}>
        There are events on the calendar — they're just hidden by what's selected right now.
      </div>
      <button
        type="button"
        onClick={() => { navigator.vibrate?.(10); onClearAll(); }}
        className="as-press"
        style={{
          minHeight: 44, padding: '0 20px', borderRadius: 10, border: '1px solid var(--as-accent)',
          backgroundColor: 'var(--as-bg-card)', color: 'var(--as-accent)', fontSize: 14, fontWeight: 600,
          fontFamily: 'inherit', cursor: 'pointer',
        }}
      >
        Clear filters
      </button>
    </div>
  );
}

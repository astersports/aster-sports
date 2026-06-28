import { Search, X } from 'lucide-react';

// Search-settings input for the L99 pass. A single 44px field that filters the
// row list live; clears via the trailing X. The match count is announced to
// screen readers through an aria-live region so a keyboard/VoiceOver user knows
// how many settings the query found. Token-only colors per CLAUDE.md §3.
export default function SettingsSearch({ value, onChange, resultCount, totalCount }) {
  const showCount = value.trim().length > 0;
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <Search size={16} strokeWidth={1.75} aria-hidden="true"
          style={{ position: 'absolute', left: 12, color: 'var(--as-text-tertiary)', pointerEvents: 'none' }} />
        <input
          type="search" value={value} onChange={(e) => onChange(e.target.value)}
          placeholder="Search settings" aria-label="Search settings"
          style={{
            width: '100%', height: 44, padding: '0 40px', boxSizing: 'border-box',
            backgroundColor: 'var(--as-bg-tertiary)', border: '1.5px solid var(--as-border-default)',
            borderRadius: 10, fontSize: 15, fontFamily: 'inherit', color: 'var(--as-text-primary)',
          }}
        />
        {value ? (
          <button
            type="button" onClick={() => onChange('')} aria-label="Clear search" className="as-press"
            style={{
              position: 'absolute', right: 6, width: 32, height: 32, display: 'flex',
              alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none',
              cursor: 'pointer', color: 'var(--as-text-tertiary)',
            }}
          >
            <X size={18} strokeWidth={1.75} aria-hidden="true" />
          </button>
        ) : null}
      </div>
      <span aria-live="polite" style={{
        display: 'block', fontSize: 11, color: 'var(--as-text-tertiary)',
        margin: '6px 4px 0', minHeight: showCount ? 14 : 0,
      }}>
        {showCount ? `${resultCount} of ${totalCount} settings` : ''}
      </span>
    </div>
  );
}

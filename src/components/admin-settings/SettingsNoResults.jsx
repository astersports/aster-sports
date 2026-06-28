import { SearchX } from 'lucide-react';

// Kind empty state shown when a search query matches no settings (§16.3
// kindness microcopy: warmth + clarity + actionability). Offers a one-tap
// "Clear search" recovery rather than leaving the admin staring at a blank
// page. Token-only colors per CLAUDE.md §3.
export default function SettingsNoResults({ query, onClear }) {
  return (
    <div role="status" style={{
      textAlign: 'center', padding: '40px 24px',
      backgroundColor: 'var(--as-bg-card)', border: '1px solid var(--as-border-default)',
      borderRadius: 10, boxShadow: 'var(--as-shadow-sm)',
    }}>
      <SearchX size={24} strokeWidth={1.75} aria-hidden="true" style={{ color: 'var(--as-text-tertiary)' }} />
      <p style={{ fontSize: 15, color: 'var(--as-text-primary)', margin: '12px 0 4px' }}>
        No settings match “{query}”
      </p>
      <p style={{ fontSize: 13, color: 'var(--as-text-tertiary)', margin: '0 0 16px' }}>
        Try a different word, or browse all settings.
      </p>
      <button
        type="button" onClick={onClear} className="as-press"
        style={{
          minHeight: 44, padding: '0 20px', borderRadius: 10, cursor: 'pointer',
          backgroundColor: 'var(--as-accent)', color: 'var(--as-text-inverse)',
          border: 'none', fontSize: 15, fontWeight: 500, fontFamily: 'inherit',
        }}
      >
        Clear search
      </button>
    </div>
  );
}

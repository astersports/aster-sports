import { Search, X } from 'lucide-react';

// L99 enhancement: filter channels + DMs by name (iMessage-style search).
// Controlled input; parent owns the query state so it can drive filtering.
export default function MessagesSearchBar({ value, onChange }) {
  return (
    <div
      style={{
        position: 'relative', display: 'flex', alignItems: 'center',
        marginBottom: 12,
      }}
    >
      <Search
        size={16}
        strokeWidth={1.75}
        color="var(--as-text-tertiary)"
        style={{ position: 'absolute', left: 12, pointerEvents: 'none' }}
        aria-hidden="true"
      />
      <input
        type="search"
        inputMode="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search messages"
        aria-label="Search messages"
        style={{
          width: '100%', height: 44, paddingLeft: 36, paddingRight: value ? 40 : 12,
          borderRadius: 10, border: '1.5px solid var(--as-border-default)',
          backgroundColor: 'var(--as-bg-tertiary)', color: 'var(--as-text-primary)',
          fontSize: 15, fontFamily: 'inherit', outline: 'none',
        }}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="as-press"
          aria-label="Clear search"
          style={{
            position: 'absolute', right: 6, width: 32, height: 32, borderRadius: 8,
            border: 'none', backgroundColor: 'transparent', display: 'flex',
            alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}
        >
          <X size={16} strokeWidth={1.75} color="var(--as-text-tertiary)" />
        </button>
      )}
    </div>
  );
}

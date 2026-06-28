// Search + circuit-filter controls for /teams. Appears only once the
// list is big enough to warrant it (TYPEAHEAD_THRESHOLD) so a small
// pilot org (5 teams) isn't shown a search box it doesn't need.
// Presentational — search/filter state lives on TeamsPage.
import { Search, X } from 'lucide-react';

export const TYPEAHEAD_THRESHOLD = 6;

const INPUT_STYLE = {
  width: '100%', minHeight: 44, padding: '10px 40px 10px 36px', borderRadius: 10,
  border: '1.5px solid var(--as-border-default)', backgroundColor: 'var(--as-bg-tertiary)',
  color: 'var(--as-text-primary)', fontSize: 15, fontFamily: 'Inter, sans-serif',
};

export default function TeamsSearchBar({ search, onSearch, circuits, circuit, onCircuit, total }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12 }}>
      <div style={{ position: 'relative' }}>
        <Search size={16} strokeWidth={1.75} aria-hidden="true"
          style={{ position: 'absolute', left: 12, top: 14, color: 'var(--as-text-tertiary)' }} />
        <input
          type="text"
          inputMode="search"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder={`Search ${total} teams`}
          aria-label="Search teams by name"
          style={INPUT_STYLE}
        />
        {search && (
          <button
            type="button"
            onClick={() => onSearch('')}
            aria-label="Clear search"
            className="as-press"
            style={{
              position: 'absolute', right: 4, top: 2, width: 40, height: 40, display: 'flex',
              alignItems: 'center', justifyContent: 'center', borderRadius: 10,
              color: 'var(--as-text-tertiary)', backgroundColor: 'transparent',
            }}
          >
            <X size={18} strokeWidth={1.75} aria-hidden="true" />
          </button>
        )}
      </div>

      {circuits.length > 1 && (
        <div role="group" aria-label="Filter teams by circuit"
          style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {[{ key: 'all', label: 'All' }, ...circuits].map(({ key, label }) => {
            const active = circuit === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => { navigator.vibrate?.(10); onCircuit(key); }}
                aria-pressed={active}
                className="as-press"
                style={{
                  minHeight: 36, padding: '8px 14px', borderRadius: 999, fontSize: 13, fontWeight: 500,
                  border: `1px solid ${active ? 'var(--as-accent)' : 'var(--as-border-default)'}`,
                  backgroundColor: active ? 'var(--as-accent-soft)' : 'var(--as-bg-card)',
                  color: active ? 'var(--as-accent)' : 'var(--as-text-secondary)',
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

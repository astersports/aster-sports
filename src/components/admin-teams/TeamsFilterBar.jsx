import { ArrowDown01, ArrowDownAZ, Search, X } from 'lucide-react';

// Search + circuit-filter + sort controls for AdminTeamsPage. Pure
// presentational: parent owns the query/circuit/sort state and the
// derived team list. Token-only colors; 44px tap targets; a11y labels
// on every interactive element (CLAUDE.md §7 + §16.4).
const CIRCUIT_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'aau', label: 'AAU' },
  { value: 'league_play', label: 'League Play' },
  { value: 'tournament', label: 'Tournament' },
];

const chip = (active) => ({
  minHeight: 32,
  padding: '0 12px',
  borderRadius: 999,
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'inherit',
  border: '1.5px solid var(--as-border-default)',
  backgroundColor: active ? 'var(--as-accent-soft)' : 'var(--as-bg-card)',
  color: active ? 'var(--as-accent)' : 'var(--as-text-secondary)',
  borderColor: active ? 'var(--as-accent)' : 'var(--as-border-default)',
});

export default function TeamsFilterBar({ query, onQuery, circuit, onCircuit, sort, onSort }) {
  return (
    <div className="flex flex-col gap-3 mb-4">
      <div style={{ position: 'relative' }}>
        <Search
          size={16}
          strokeWidth={1.75}
          aria-hidden="true"
          style={{ position: 'absolute', left: 12, top: 14, color: 'var(--as-text-tertiary)' }}
        />
        <label htmlFor="teams-search" className="as-sr-only">Search teams by name</label>
        <input
          id="teams-search"
          type="text"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="Search teams…"
          autoComplete="off"
          style={{
            width: '100%',
            minHeight: 44,
            padding: '0 40px 0 36px',
            borderRadius: 10,
            border: '1.5px solid var(--as-border-default)',
            backgroundColor: 'var(--as-bg-tertiary)',
            color: 'var(--as-text-primary)',
            fontSize: 15,
            fontFamily: 'inherit',
          }}
        />
        {query && (
          <button
            type="button"
            onClick={() => onQuery('')}
            aria-label="Clear search"
            className="as-press"
            style={{
              position: 'absolute', right: 4, top: 4, minWidth: 36, minHeight: 36,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              background: 'none', border: 'none', cursor: 'pointer', color: 'var(--as-text-tertiary)',
            }}
          >
            <X size={18} strokeWidth={2} aria-hidden="true" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <div role="group" aria-label="Filter by competition type" className="flex gap-2 flex-wrap">
          {CIRCUIT_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => onCircuit(o.value)}
              aria-pressed={circuit === o.value}
              className="as-press"
              style={chip(circuit === o.value)}
            >
              {o.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => onSort(sort === 'age' ? 'name' : 'age')}
          aria-label={sort === 'age' ? 'Sorted by age — tap to sort alphabetically' : 'Sorted alphabetically — tap to sort by age'}
          className="as-press"
          style={{ ...chip(false), marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 4 }}
        >
          {sort === 'age'
            ? <ArrowDown01 size={16} strokeWidth={1.75} aria-hidden="true" />
            : <ArrowDownAZ size={16} strokeWidth={1.75} aria-hidden="true" />}
          {sort === 'age' ? 'Age' : 'A–Z'}
        </button>
      </div>
    </div>
  );
}

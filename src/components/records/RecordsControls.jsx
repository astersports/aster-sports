import { ArrowUpDown, Filter } from 'lucide-react';
import { RECORDS_FILTERS, RECORDS_SORT_OPTIONS } from './recordsSort';

// Sort + circuit-filter control row for the Records team list. Chips reuse the
// broadcast palette (--as-bc-*) so the row reads as part of the dark records
// surface. 44px tap targets, aria-pressed on every chip.
const CHIP = {
  fontFamily: "'Barlow Condensed', sans-serif", fontSize: 13, fontWeight: 700,
  letterSpacing: '0.06em', textTransform: 'uppercase', padding: '0 14px',
  minHeight: 44, display: 'inline-flex', alignItems: 'center', gap: 6,
  borderRadius: 8, cursor: 'pointer',
};

// Toggle buttons (aria-pressed) inside the parent role="group" — not
// role="radio" (mixing role=radio with aria-pressed is invalid ARIA; radios
// would need aria-checked + a radiogroup). aria-pressed toggles are correct
// here and announce cleanly.
function Chip({ on, onClick, label, icon: Icon }) {
  return (
    <button
      type="button" className="as-press" aria-pressed={on}
      aria-label={label} onClick={onClick}
      style={{
        ...CHIP,
        border: on ? '1px solid var(--as-bc-cobalt)' : '1px solid rgba(255,255,255,0.15)',
        background: on ? 'var(--as-bc-cobalt)' : 'rgba(255,255,255,0.05)',
        color: on ? '#151525' : 'rgba(255,255,255,0.7)',
      }}
    >
      {Icon ? <Icon size={14} strokeWidth={1.75} aria-hidden="true" /> : null}
      {label}
    </button>
  );
}

export default function RecordsControls({ sort, onSort, filter, onFilter, filterCounts }) {
  const visibleFilters = RECORDS_FILTERS.filter((f) => f.key === 'all' || (filterCounts[f.key] || 0) > 0);
  // Single-circuit seasons don't need the filter row at all.
  const showFilters = visibleFilters.length > 2;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
      <div role="group" aria-label="Sort teams" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', alignSelf: 'center' }}>
          <ArrowUpDown size={13} strokeWidth={1.75} aria-hidden="true" /> Sort
        </span>
        {RECORDS_SORT_OPTIONS.map((o) => (
          <Chip key={o.key} on={sort === o.key} label={o.label} onClick={() => onSort(o.key)} />
        ))}
      </div>
      {showFilters && (
        <div role="group" aria-label="Filter by circuit" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', alignSelf: 'center' }}>
            <Filter size={13} strokeWidth={1.75} aria-hidden="true" /> Circuit
          </span>
          {visibleFilters.map((f) => (
            <Chip key={f.key} on={filter === f.key} label={f.label} onClick={() => onFilter(f.key)} />
          ))}
        </div>
      )}
    </div>
  );
}

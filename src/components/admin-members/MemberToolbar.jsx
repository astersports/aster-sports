// L99 enhancement — filter + sort toolbar for the members directory.
// Link-state filter (All / Linked / Needs kid) plus a sort toggle
// (Name / Most kids). Reuses the shared SegmentedControl so the radio
// a11y + 44px targets come for free. Tokens only.
import { ArrowDown01, ArrowDownAZ } from 'lucide-react';
import SegmentedControl from '../shared/SegmentedControl';

const FILTER_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'linked', label: 'Linked' },
  { value: 'unlinked', label: 'Needs kid' },
];

export default function MemberToolbar({ filter, onFilterChange, sortKey, onSortChange }) {
  const sortIsName = sortKey !== 'kids';
  return (
    <div className="flex items-center gap-2 mb-3">
      <div style={{ flex: 1, minWidth: 0 }}>
        <SegmentedControl
          label="Filter members by kid-link state"
          value={filter}
          onChange={onFilterChange}
          options={FILTER_OPTIONS}
        />
      </div>
      <button
        type="button"
        onClick={() => onSortChange(sortIsName ? 'kids' : 'name')}
        aria-label={sortIsName ? 'Sort by name. Tap to sort by most kids.' : 'Sort by most kids. Tap to sort by name.'}
        className="as-press"
        style={{
          flexShrink: 0, minHeight: 44, minWidth: 44,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          padding: '0 12px', borderRadius: 10, fontFamily: 'inherit',
          fontSize: 13, fontWeight: 600, color: 'var(--as-text-secondary)',
          backgroundColor: 'var(--as-bg-secondary)', border: '1px solid var(--as-border-default)',
          cursor: 'pointer',
        }}
      >
        {sortIsName
          ? <ArrowDownAZ size={18} strokeWidth={1.75} aria-hidden="true" />
          : <ArrowDown01 size={18} strokeWidth={1.75} aria-hidden="true" />}
        <span>{sortIsName ? 'Name' : 'Kids'}</span>
      </button>
    </div>
  );
}

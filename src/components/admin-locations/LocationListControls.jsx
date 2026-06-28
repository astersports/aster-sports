import { AlertTriangle, ArrowDownAZ, MapPinOff } from 'lucide-react';

// Result-count summary + sort control + map-completeness banner for the
// Locations list. All token-only colors, 44px targets, a11y-labeled. The page
// owns sort state; this is presentational. `liveMessage` drives the page's
// shared aria-live region (rendered by the page, not here, to keep one region).

const SORTS = [
  { key: 'name', label: 'Name', Icon: ArrowDownAZ },
  { key: 'needs_map', label: 'Needs map', Icon: MapPinOff },
];

export default function LocationListControls({ count, sort, setSort, incompleteCount, showArchived, isStaff }) {
  const summary = count === 1 ? '1 venue' : `${count} venues`;

  const chip = (active) => ({
    minHeight: 44, padding: '0 12px', borderRadius: 999,
    border: `1.5px solid ${active ? 'var(--as-accent)' : 'var(--as-border-default)'}`,
    backgroundColor: active ? 'var(--as-accent-soft)' : 'var(--as-bg-card)',
    color: active ? 'var(--as-accent)' : 'var(--as-text-secondary)',
    fontSize: 13, fontWeight: active ? 600 : 400, cursor: 'pointer',
    display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'inherit',
  });

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--as-text-secondary)' }}>
          {summary}{showArchived ? ' archived' : ''}
        </span>
        <div role="group" aria-label="Sort venues" style={{ display: 'flex', gap: 6 }}>
          {(isStaff ? SORTS : SORTS.filter((s) => s.key !== 'needs_map')).map(({ key, label, Icon }) => (
            <button
              key={key}
              type="button"
              className="as-press"
              onClick={() => setSort(key)}
              aria-pressed={sort === key}
              aria-label={`Sort by ${label}`}
              style={chip(sort === key)}
            >
              <Icon size={14} strokeWidth={1.75} aria-hidden="true" /> {label}
            </button>
          ))}
        </div>
      </div>

      {isStaff && incompleteCount > 0 && (
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px',
            borderRadius: 10, backgroundColor: 'var(--as-warning-soft)',
            border: '1px solid var(--as-warning)', color: 'var(--as-warning)',
            fontSize: 13, fontWeight: 500,
          }}
        >
          <AlertTriangle size={16} strokeWidth={1.75} style={{ flexShrink: 0 }} aria-hidden="true" />
          <span style={{ color: 'var(--as-text-primary)' }}>
            {incompleteCount === 1 ? '1 venue is' : `${incompleteCount} venues are`} missing a map link.
            Add a Google Maps pin or address so families can get directions.
          </span>
        </div>
      )}
    </div>
  );
}

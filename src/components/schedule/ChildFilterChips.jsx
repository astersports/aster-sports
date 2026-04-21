import { memo } from 'react';

// Horizontal chip row for filtering a multi-kid parent's event stream
// by kid. Returns null when the parent has fewer than 2 kids — single-kid
// parents never see these chips. "All" is first, then one chip per kid
// in myChildren order. Single-select: tapping any chip sets activeFilter
// to that playerId; tapping "All" clears it.
function ChildFilterChips({ kids, activeFilter, onChange }) {
  if (!kids || kids.length < 2) return null;

  const chipStyle = (active) => ({
    flexShrink: 0,
    minHeight: 32,
    padding: '0 14px',
    borderRadius: 999,
    border: active ? '1.5px solid var(--sf-accent)' : '1.5px solid var(--sf-border-default)',
    backgroundColor: active ? 'var(--sf-accent-soft)' : 'var(--sf-bg-card)',
    color: active ? 'var(--sf-accent)' : 'var(--sf-text-primary)',
    fontSize: 13,
    fontWeight: active ? 600 : 400,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    fontFamily: 'inherit',
  });

  return (
    <div
      className="sf-no-scrollbar"
      style={{
        display: 'flex',
        gap: 8,
        overflowX: 'auto',
        marginBottom: 12,
        paddingBottom: 2,
      }}
    >
      <button
        type="button"
        onClick={() => onChange(null)}
        className="sf-press"
        style={chipStyle(activeFilter === null)}
      >
        All
      </button>
      {kids.map((kid) => (
        <button
          key={kid.playerId}
          type="button"
          onClick={() => onChange(kid.playerId)}
          className="sf-press"
          style={chipStyle(activeFilter === kid.playerId)}
        >
          {kid.firstName}
        </button>
      ))}
    </div>
  );
}

export default memo(ChildFilterChips);

import { ChevronDown, MoreVertical } from 'lucide-react';

// Teams redesign PR-1 (render S7): the thin TRAILING SLOT of a roster row,
// split out of PlayerRow so PlayerRow stays <=150 LOC as PR-2/PR-3 add the
// edit-mode overflow + per-player money affordance into this slot. PR-2 Part A
// adds the staff-only manage (⋯) trigger; it stops row-tap propagation so the
// row's expand toggle doesn't also fire. No ⋯ for non-managers (onMenu unset).
export default function PlayerRowActions({ jerseyNumber, teamColor, expanded, onMenu }) {
  return (
    <>
      {jerseyNumber != null && (
        <div style={{
          width: 32, height: 32, borderRadius: '50%', border: `2px solid ${teamColor || 'var(--as-neutral)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 700, color: teamColor || 'var(--as-text-primary)', flexShrink: 0,
        }}>{jerseyNumber}</div>
      )}
      {onMenu && (
        <button type="button" aria-label="Manage player"
          onClick={(e) => { e.stopPropagation(); navigator.vibrate?.(10); onMenu(); }}
          className="as-press flex items-center justify-center"
          style={{ width: 44, height: 44, marginLeft: 2, background: 'none', border: 'none', borderRadius: 8, flexShrink: 0 }}>
          <MoreVertical size={18} strokeWidth={1.75} color="var(--as-text-tertiary)" />
        </button>
      )}
      <ChevronDown size={16} strokeWidth={1.75} color="var(--as-text-tertiary)"
        style={{ marginLeft: 8, flexShrink: 0, transform: expanded ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 150ms' }} />
    </>
  );
}

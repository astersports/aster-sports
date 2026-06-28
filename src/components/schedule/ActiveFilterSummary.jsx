import { memo } from 'react';
import { X } from 'lucide-react';
import { TYPE_OPTIONS } from '../../lib/constants';

// L99 SchedulePage enhancement #2/#3: when team/kid/type/cancelled
// filters are active the list silently shrinks with no at-a-glance way
// to see WHAT is filtering it or to undo it. This renders a wrapping
// (responsive) row of dismissable filter chips + a "Clear all", and an
// aria-live polite region announcing the filtered result count so the
// shrink is legible to screen readers (§16.4) rather than a silent jump.
function chip(label, onClear, key) {
  return (
    <button
      key={key}
      type="button"
      onClick={() => { navigator.vibrate?.(10); onClear(); }}
      aria-label={`Remove filter: ${label}`}
      className="as-press"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4, minHeight: 44, padding: '0 6px 0 12px',
        borderRadius: 999, border: '1px solid var(--as-accent)', backgroundColor: 'var(--as-accent-soft)',
        color: 'var(--as-accent)', fontSize: 13, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer',
      }}
    >
      <span>{label}</span>
      <span aria-hidden="true" style={{ display: 'inline-flex', padding: 4 }}><X size={14} strokeWidth={2} /></span>
    </button>
  );
}

function ActiveFilterSummary({
  resultCount, teamName, onClearTeam, kidName, onClearKid,
  selectedType, onClearType, showCancelled, onClearCancelled, onClearAll,
}) {
  const typeLabel = selectedType
    ? (TYPE_OPTIONS.find((o) => o.key === selectedType)?.label || selectedType)
    : null;
  const chips = [];
  if (kidName) chips.push(chip(kidName, onClearKid, 'kid'));
  if (teamName) chips.push(chip(teamName, onClearTeam, 'team'));
  if (typeLabel) chips.push(chip(typeLabel, onClearType, 'type'));
  if (showCancelled) chips.push(chip('Cancelled shown', onClearCancelled, 'cancelled'));

  return (
    <div style={{ paddingBottom: chips.length ? 4 : 0 }}>
      <p aria-live="polite" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
        {`${resultCount} ${resultCount === 1 ? 'event' : 'events'}${chips.length ? ' after filters' : ''}`}
      </p>
      {chips.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
          {chips}
          <button
            type="button"
            onClick={() => { navigator.vibrate?.(10); onClearAll(); }}
            className="as-press"
            style={{
              minHeight: 44, padding: '0 8px', background: 'none', border: 'none', color: 'var(--as-text-tertiary)',
              fontSize: 13, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer', textDecoration: 'underline',
            }}
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}

export default memo(ActiveFilterSummary);

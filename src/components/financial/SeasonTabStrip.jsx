// L99 E5 — accessible, responsive season selector. Was an inline button row on
// the page with no ARIA + no keyboard model. Now a real tablist: arrow-key nav,
// aria-selected, roving tabindex, and a horizontal-scroll container with momentum
// on touch. An owing-dot marks seasons that have families owing — sourced from
// the page's existing `owingSeasonIds` Set (the SAME family_balances-derived set
// the page already computes; no second source/scope, AP#63).
import { useRef } from 'react';

export default function SeasonTabStrip({ seasons, seasonId, owingSeasonIds, onSelect }) {
  const refs = useRef([]);

  const onKeyDown = (e, idx) => {
    let next = null;
    if (e.key === 'ArrowRight') next = (idx + 1) % seasons.length;
    else if (e.key === 'ArrowLeft') next = (idx - 1 + seasons.length) % seasons.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = seasons.length - 1;
    if (next == null) return;
    e.preventDefault();
    onSelect(seasons[next].id);
    refs.current[next]?.focus();
  };

  return (
    <div role="tablist" aria-label="Financial season" style={strip}>
      {seasons.map((s, idx) => {
        const active = s.id === seasonId;
        const owing = owingSeasonIds?.has(s.id);
        return (
          <button
            key={s.id}
            ref={(el) => { refs.current[idx] = el; }}
            role="tab"
            type="button"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onSelect(s.id)}
            onKeyDown={(e) => onKeyDown(e, idx)}
            className="as-press"
            style={{
              ...tab,
              border: active ? 'none' : '1px solid var(--as-border-default)',
              backgroundColor: active ? 'var(--as-accent)' : 'var(--as-bg-card)',
              color: active ? 'var(--as-text-inverse)' : 'var(--as-text-secondary)',
            }}
          >
            {s.name}
            {owing && (
              <span
                aria-label="has families owing"
                style={{ ...dot, backgroundColor: active ? 'var(--as-text-inverse)' : 'var(--as-danger)' }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

const strip = { display: 'flex', gap: 6, marginBottom: 16, overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' };
const tab = { display: 'inline-flex', alignItems: 'center', gap: 6, minHeight: 44, padding: '0 14px', borderRadius: 9999, fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', fontFamily: 'inherit', cursor: 'pointer', flexShrink: 0 };
const dot = { width: 6, height: 6, borderRadius: '50%', flexShrink: 0 };

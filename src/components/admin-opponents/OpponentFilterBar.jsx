// §4.O L99 — circuit filter chips + sort control for the opponents
// directory. Tokens only; 44px tap targets; keyboard-operable chips with
// aria-pressed. Pure presentational — state lives in the page.

import { ArrowUpDown } from 'lucide-react';
import { SORT_OPTIONS } from './opponentUtils';

function Chip({ active, onClick, children, count }) {
  return (
    <button
      type="button"
      className="as-press"
      onClick={onClick}
      aria-pressed={active}
      style={{
        minHeight: 44,
        padding: '0 14px',
        borderRadius: 9999,
        fontSize: 13,
        fontWeight: 600,
        fontFamily: 'inherit',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        backgroundColor: active ? 'var(--as-accent-soft)' : 'var(--as-bg-secondary)',
        color: active ? 'var(--as-accent)' : 'var(--as-text-secondary)',
        border: active ? '1.5px solid var(--as-accent)' : '1.5px solid var(--as-border-subtle)',
      }}
    >
      {children}
      {typeof count === 'number' && (
        <span style={{ fontSize: 11, opacity: 0.85 }}>{count}</span>
      )}
    </button>
  );
}

export default function OpponentFilterBar({ circuits, circuit, onCircuit, sort, onSort }) {
  return (
    <div className="flex flex-col gap-2 mb-3">
      <div
        className="flex gap-2 overflow-x-auto"
        role="group"
        aria-label="Filter opponents by circuit"
        style={{ paddingBottom: 2 }}
      >
        {circuits.map((c) => (
          <Chip key={c.value} active={circuit === c.value} onClick={() => onCircuit(c.value)} count={c.count}>
            {c.label}
          </Chip>
        ))}
      </div>
      <label
        className="flex items-center gap-2 self-start"
        style={{ fontSize: 13, color: 'var(--as-text-secondary)' }}
      >
        <ArrowUpDown size={16} strokeWidth={1.75} aria-hidden="true" />
        <span>Sort</span>
        <select
          value={sort}
          onChange={(e) => onSort(e.target.value)}
          aria-label="Sort opponents"
          style={{
            minHeight: 44,
            padding: '0 10px',
            borderRadius: 10,
            fontSize: 13,
            fontFamily: 'inherit',
            fontWeight: 600,
            color: 'var(--as-text-primary)',
            backgroundColor: 'var(--as-bg-tertiary)',
            border: '1.5px solid var(--as-border-default)',
          }}
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </label>
    </div>
  );
}

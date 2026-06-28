// Per-child filter chips (L99 enhancement). For families with multiple kids,
// a chip row scopes the enrollment cards to one child at a time — clarity at
// scale without hiding anything (an "Everyone" chip always restores the full
// view). Only renders for 2+ children. Radio-group semantics for a11y; 44px
// tap targets; --as-* tokens only.
export default function ChildFilterChips({ children, selectedId, onSelect }) {
  if (children.length < 2) return null;
  const options = [{ id: null, label: 'Everyone' }, ...children.map((c) => ({ id: c.id, label: c.firstName }))];

  return (
    <div role="radiogroup" aria-label="Filter by child" style={row}>
      {options.map((o) => {
        const active = (o.id ?? null) === (selectedId ?? null);
        return (
          <button
            key={o.id ?? 'all'}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onSelect(o.id)}
            className="as-press"
            style={{ ...chip, ...(active ? chipActive : null) }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

const row = { display: 'flex', gap: 8, overflowX: 'auto', padding: '2px 0 10px', WebkitOverflowScrolling: 'touch' };
const chip = { flex: 'none', minHeight: 44, padding: '0 14px', display: 'inline-flex', alignItems: 'center', backgroundColor: 'var(--as-bg-card)', border: '1px solid var(--as-border-default)', borderRadius: 999, fontSize: 13, fontWeight: 600, color: 'var(--as-text-secondary)', whiteSpace: 'nowrap' };
const chipActive = { backgroundColor: 'var(--as-accent)', borderColor: 'var(--as-accent)', color: 'var(--as-text-inverse)' };

// Presentational variants for ChildRsvp (logic stays in ChildRsvp.jsx).
// Split out in PR-V2 when the round-2 'buttons' variant pushed the host
// past the 150 cap. All variants keep the 44px floor where interactive.

// R2-3 RSVP primacy: Going is THE action — filled when selected,
// success-tinted outline when idle; "Can't make it" is always quiet.
export function ButtonsVariant({ response, disabled, onPick }) {
  const going = response === 'going';
  const out = response === 'not_going';
  return (
    <div style={{ display: 'flex', gap: 8, marginTop: 11, opacity: disabled ? 0.5 : 1 }}>
      <button type="button" onClick={(e) => onPick(e, 'going')} className="as-press" aria-pressed={going}
        style={{
          flex: 1, minHeight: 44, borderRadius: 8, fontSize: 13, fontWeight: 700, fontFamily: 'inherit',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer',
          ...(going
            ? { backgroundColor: 'var(--as-success)', color: 'var(--as-text-inverse)', border: 'none', boxShadow: '0 1px 3px rgba(22,163,74,.35)' }
            : { backgroundColor: 'var(--as-bg-card)', color: 'var(--as-success)', border: '1.5px solid var(--as-success)' }),
          ...(disabled ? { pointerEvents: 'none' } : {}),
        }}>
        ✓ Going
      </button>
      <button type="button" onClick={(e) => onPick(e, 'not_going')} className="as-press" aria-pressed={out}
        style={{
          flex: 1, minHeight: 44, borderRadius: 8, fontSize: 13, fontWeight: 700, fontFamily: 'inherit',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          backgroundColor: out ? 'var(--as-bg-secondary)' : 'var(--as-bg-card)',
          color: out ? 'var(--as-text-secondary)' : 'var(--as-text-tertiary)',
          border: '1.5px solid var(--as-border-default)',
          ...(disabled ? { pointerEvents: 'none' } : {}),
        }}>
        Can't make it
      </button>
    </div>
  );
}

export function SegmentedVariant({ response, disabled, onPick }) {
  const segs = [
    { value: 'going', label: '✓ Going', on: { backgroundColor: 'var(--as-success-soft)', color: 'var(--as-success)' } },
    { value: 'not_going', label: "Can't make it", on: { backgroundColor: 'var(--as-bg-secondary)', color: 'var(--as-text-tertiary)' } },
  ];
  return (
    <div style={{ display: 'flex', marginTop: 8, border: '1.5px solid var(--as-border-default)', borderRadius: 8, overflow: 'hidden', minHeight: 44, opacity: disabled ? 0.5 : 1 }}>
      {segs.map((s, i) => (
        <button key={s.value} type="button" onClick={(e) => onPick(e, s.value)} className="as-press" aria-pressed={response === s.value}
          style={{ flex: 1, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 13, fontWeight: 600, fontFamily: 'inherit', border: 'none', borderLeft: i > 0 ? '1.5px solid var(--as-border-default)' : 'none', background: 'transparent', color: 'var(--as-text-secondary)', cursor: 'pointer', ...(response === s.value ? s.on : {}), ...(disabled ? { pointerEvents: 'none' } : {}) }}>
          {s.label}
        </button>
      ))}
    </div>
  );
}

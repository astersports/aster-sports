import { Fragment, useCallback } from 'react';

const QUARTERS = ['q1', 'q2', 'q3', 'q4'];
const LABELS = { q1: 'Q1', q2: 'Q2', q3: 'Q3', q4: 'Q4' };
const qInput = { width: '100%', minHeight: 44, padding: '0 10px', borderRadius: 8, border: '1px solid var(--as-border-default)', backgroundColor: 'var(--as-bg-card)', color: 'var(--as-text-primary)', fontSize: 17, fontWeight: 600, fontFamily: 'inherit', textAlign: 'center' };

export default function QuarterScoreInput({ value, onChange, disabled }) {
  const setField = useCallback((q, side, raw) => {
    const next = { ...(value ?? {}) };
    next[q] = { ...(next[q] ?? {}), [side]: raw === '' ? null : Number(raw) };
    const allEmpty = QUARTERS.every(k => next[k]?.us == null && next[k]?.them == null);
    onChange(allEmpty ? null : next);
  }, [value, onChange]);

  return (
    <div style={{ marginTop: 24 }}>
      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--as-text-primary)', marginBottom: 12 }}>
        Quarter Scores (optional)
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '32px 1fr 1fr', gap: 8, alignItems: 'center' }}>
        <span />
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--as-text-tertiary)', textAlign: 'center' }}>Us</div>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--as-text-tertiary)', textAlign: 'center' }}>Them</div>
        {QUARTERS.map(q => (
          <Fragment key={q}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--as-text-secondary)' }}>{LABELS[q]}</span>
            <input type="number" inputMode="numeric" pattern="[0-9]*" value={value?.[q]?.us ?? ''} onChange={e => setField(q, 'us', e.target.value)} disabled={disabled} style={qInput} />
            <input type="number" inputMode="numeric" pattern="[0-9]*" value={value?.[q]?.them ?? ''} onChange={e => setField(q, 'them', e.target.value)} disabled={disabled} style={qInput} />
          </Fragment>
        ))}
      </div>
    </div>
  );
}

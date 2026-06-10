import { formatCurrency } from '../../lib/formatters';
import { registrationErrorInfo } from '../../lib/registrationErrors';
import { primaryBtn } from './registerStyles';

// R1 (render G2) — the multi-child accumulation hub. Each committed child is a row
// (edit / remove); "Add another child" appends to the client children[] array; the
// running total previews estimateCart (incl. the family discount when an org policy
// fires). "Register all" submits the WHOLE array in ONE submit_registration call —
// which is what lets the family-cap discount apply (dead under per-child submit).
// The shown total is a PREVIEW; the authoritative number comes from the server on
// the confirmation (#63 — estimate is never presented as the owed amount here).
export default function StepChildrenRoster({ rows, cart, submitting, error, onAdd, onEdit, onRemove, onSubmit }) {
  const n = rows.length;
  return (
    <div>
      {rows.map((r, i) => (
        <div key={i} style={rowCard}>
          <span style={avatar} aria-hidden="true">{(r.name || '?').charAt(0).toUpperCase()}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--as-text-primary)' }}>{r.name}</div>
            <div style={{ fontSize: 11.5, color: 'var(--as-text-tertiary)' }}>{r.label}{r.feeCents ? ` · ${formatCurrency(r.feeCents)}` : ''}</div>
          </div>
          <button type="button" style={miniBtn} onClick={() => onEdit(i)} aria-label={`Edit ${r.name}`}>Edit</button>
          <button type="button" style={{ ...miniBtn, color: 'var(--as-danger)' }} onClick={() => onRemove(i)} aria-label={`Remove ${r.name}`}>Remove</button>
        </div>
      ))}

      <button type="button" className="as-press" style={addBtn} onClick={onAdd}>+ Add another child</button>

      {n > 0 && (
        <div style={totalBox}>
          <div style={lr}><span>{n} {n === 1 ? 'child' : 'children'}</span><b>{formatCurrency(cart.subtotalCents)}</b></div>
          {cart.discountCents > 0 && (
            <div style={{ ...lr, color: 'var(--as-success)' }}><span>Family discount</span><b>−{formatCurrency(cart.discountCents)}</b></div>
          )}
          <div style={{ ...lr, ...bigLr }}><span>Running total</span><b>{formatCurrency(cart.totalCents)}</b></div>
          <div style={note}>Preview — the final amount is confirmed at the next step.</div>
        </div>
      )}

      {error && <div role="alert" style={errStyle}>{registrationErrorInfo(error).message}</div>}

      <button type="button" className="as-press" style={{ ...primaryBtn, marginTop: 12, opacity: n === 0 || submitting ? 0.5 : 1 }} disabled={n === 0 || submitting} onClick={onSubmit}>
        {submitting ? 'Reserving…' : `Register ${n === 1 ? '1 child' : `${n} children`} · ${formatCurrency(cart.totalCents)}`}
      </button>
    </div>
  );
}

const rowCard = { display: 'flex', alignItems: 'center', gap: 10, backgroundColor: 'var(--as-bg-card)', border: '1px solid var(--as-border-default)', borderRadius: 13, padding: '12px 14px', marginBottom: 8 };
const avatar = { width: 36, height: 36, borderRadius: '50%', backgroundColor: 'var(--as-accent-soft)', color: 'var(--as-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, flex: 'none' };
const miniBtn = { background: 'none', border: 'none', color: 'var(--as-accent)', fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: '4px 6px', minHeight: 44 };
const addBtn = { width: '100%', minHeight: 50, border: '1.5px dashed var(--as-accent)', backgroundColor: 'var(--as-bg-card)', color: 'var(--as-accent)', borderRadius: 13, fontSize: 14, fontWeight: 700, cursor: 'pointer', marginBottom: 12 };
const totalBox = { backgroundColor: 'var(--as-bg-card)', border: '1px solid var(--as-border-default)', borderRadius: 13, padding: 15, marginBottom: 4 };
const lr = { display: 'flex', justifyContent: 'space-between', fontSize: 13.5, color: 'var(--as-text-secondary)', marginBottom: 8 };
const bigLr = { margin: '9px 0 0', paddingTop: 10, borderTop: '1px solid var(--as-border-subtle)', fontSize: 16, color: 'var(--as-text-primary)', fontWeight: 700 };
const note = { fontSize: 11.5, color: 'var(--as-text-tertiary)', marginTop: 8 };
const errStyle = { padding: '8px 12px', borderRadius: 10, backgroundColor: 'var(--as-danger-soft)', color: 'var(--as-danger)', fontSize: 13, margin: '8px 0' };

import { useState } from 'react';
import { formatCurrency } from '../../../lib/formatters';

// A1 (render G4) — one admin registration row. The lifecycle badge
// (registration.status) is kept SEPARATE from the fee line: "Mark confirmed"
// writes status='confirmed' ONLY — it does NOT mark paid. Payment truth lives in
// Financials / family_balances, so a confirmed registrant can still owe and a
// pending one can already have paid. Two states, never merged (#63 discipline).
const STATUS = {
  pending: { label: 'Pending', bg: 'var(--as-warning-soft)', fg: 'var(--as-warning)' },
  confirmed: { label: 'Confirmed', bg: 'var(--as-success-soft)', fg: 'var(--as-success)' },
  waitlist: { label: 'Waitlist', bg: 'var(--as-info-soft)', fg: 'var(--as-info)' },
  cancelled: { label: 'Cancelled', bg: 'var(--as-neutral-soft)', fg: 'var(--as-text-tertiary)' },
  payment_overdue: { label: 'Overdue', bg: 'var(--as-danger-soft)', fg: 'var(--as-danger)' },
};
const feeTotal = (r) => (r.registration_fees || []).reduce((s, f) => s + (f.amount_cents || 0), 0);

export default function RegistrationRow({ registration: r, onConfirm }) {
  const [busy, setBusy] = useState(false);
  const st = STATUS[r.status] || STATUS.pending;
  const name = `${r.players?.first_name || ''} ${r.players?.last_name || ''}`.trim() || 'Player';

  const confirm = async () => { setBusy(true); await onConfirm(r.id); setBusy(false); };

  return (
    <div style={card}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ flex: 1, fontSize: 15, fontWeight: 600, color: 'var(--as-text-primary)' }}>{name}</span>
        <span style={{ ...badge, backgroundColor: st.bg, color: st.fg }}>{st.label}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
        <span style={{ fontSize: 13, color: 'var(--as-text-tertiary)' }}>{formatCurrency(feeTotal(r))} fee</span>
        {r.status === 'pending' && (
          <button type="button" className="as-press" style={confirmBtn} disabled={busy} onClick={confirm} aria-label={`Mark ${name} confirmed`}>
            {busy ? 'Saving…' : '✓ Mark confirmed'}
          </button>
        )}
        {r.status === 'confirmed' && <span style={{ fontSize: 11.5, color: 'var(--as-text-tertiary)' }}>Confirmed by admin</span>}
      </div>
    </div>
  );
}

const card = { backgroundColor: 'var(--as-bg-card)', border: '1px solid var(--as-border-default)', borderRadius: 10, boxShadow: 'var(--as-shadow-sm)', padding: '12px 14px', marginBottom: 8 };
const badge = { fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 6 };
const confirmBtn = { minHeight: 36, padding: '0 12px', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: 'var(--as-accent)', border: '1px solid var(--as-border-default)', borderRadius: 9, backgroundColor: 'var(--as-bg-card)', cursor: 'pointer' };

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { formatCurrency } from '../../lib/formatters';

const METHOD = { venmo: 'Venmo', zelle: 'Zelle', cash: 'Cash', check: 'Check', stripe: 'Card/Stripe', other: 'Other' };
const STATUS_COLOR = { pending: 'var(--as-warning)', paid: 'var(--as-success)', disputed: 'var(--as-danger)' };

const initials = (name) => (name || '?').split(/\s+/).filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
const dateLabel = (iso) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/New_York' });

// Per-coach card for Financials → Coaches. RATED coaches (a per-session rate on
// their coaching_assignment) show OWED (rate × sessions) vs PAID → BALANCE as
// the headline; unrated coaches (directors/volunteers) just show recorded pay.
// Tap to expand the comp breakdown + individual payout rows.
export default function CoachPayoutCard({ coach, onSetRate, onRecordPayout }) {
  const [open, setOpen] = useState(false);
  const rated = coach.rateCents > 0;
  const balance = coach.balanceCents;

  return (
    <div style={{ backgroundColor: 'var(--as-bg-card)', borderRadius: 10, border: '1px solid var(--as-border-default)', overflow: 'hidden', marginBottom: 8 }}>
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="as-press"
        style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '12px 14px', minHeight: 44, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
        <div style={{ width: 36, height: 36, borderRadius: 9999, flexShrink: 0, backgroundColor: 'var(--as-accent-soft)', color: 'var(--as-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }}>
          {initials(coach.name)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--as-text-primary)' }}>{coach.name}</div>
          <div style={{ fontSize: 12, color: 'var(--as-text-tertiary)' }}>
            {rated ? `${formatCurrency(coach.rateCents)}/session` : `${coach.rows.length} payout${coach.rows.length === 1 ? '' : 's'}`}
            {coach.defaultMethod ? ` · ${METHOD[coach.defaultMethod] || coach.defaultMethod}` : ''}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          {rated ? (
            <>
              <div style={{ fontSize: 15, fontWeight: 700, color: balance > 0 ? 'var(--as-danger)' : 'var(--as-success)' }}>{formatCurrency(Math.abs(balance))}</div>
              <div style={{ fontSize: 11, color: 'var(--as-text-tertiary)' }}>{balance > 0 ? 'still owed' : 'settled'} · {formatCurrency(coach.paidCents)} paid</div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--as-text-primary)' }}>{formatCurrency(coach.paidCents + coach.pendingCents)}</div>
              <div style={{ fontSize: 11, color: 'var(--as-text-tertiary)' }}>{formatCurrency(coach.paidCents)} paid{coach.pendingCents > 0 ? ` · ${formatCurrency(coach.pendingCents)} pending` : ''}</div>
            </>
          )}
        </div>
        <ChevronDown size={18} strokeWidth={1.75} color="var(--as-text-tertiary)" style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 200ms ease-out' }} />
      </button>
      {open && (
        <>
          <div style={{ display: 'flex', gap: 8, padding: '10px 14px', borderTop: '1px solid var(--as-border-subtle)' }}>
            <button type="button" onClick={() => onSetRate?.(coach)} className="as-press"
              style={{ flex: 1, minHeight: 40, borderRadius: 10, border: '1px solid var(--as-border-default)', backgroundColor: 'var(--as-bg-card)', color: 'var(--as-text-secondary)', fontSize: 13, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer' }}>
              Pay settings
            </button>
            <button type="button" onClick={() => onRecordPayout?.(coach)} className="as-press"
              style={{ flex: 1, minHeight: 40, borderRadius: 10, border: 'none', backgroundColor: 'var(--as-accent)', color: 'var(--as-text-inverse)', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
              Record payout
            </button>
          </div>
          {rated && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 14px', borderTop: '1px solid var(--as-border-subtle)', fontSize: 12, color: 'var(--as-text-secondary)' }}>
              <span>Owed {formatCurrency(coach.owedCents)}</span>
              <span>Paid {formatCurrency(coach.paidCents)}</span>
              {coach.pendingCents > 0 && <span>Pending {formatCurrency(coach.pendingCents)}</span>}
            </div>
          )}
          {coach.rows.length === 0
            ? <div style={{ padding: '10px 14px', borderTop: '1px solid var(--as-border-subtle)', fontSize: 12, color: 'var(--as-text-tertiary)' }}>No payouts recorded yet.</div>
            : coach.rows.map((p) => (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px 10px 62px', borderTop: '1px solid var(--as-border-subtle)' }}>
                <div>
                  <div style={{ fontSize: 13, color: 'var(--as-text-secondary)' }}>{dateLabel(p.paid_at || p.created_at)}</div>
                  <div style={{ fontSize: 12, color: 'var(--as-text-tertiary)' }}>{METHOD[p.payment_method] || 'Not specified'}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--as-text-primary)' }}>{formatCurrency(p.amount_cents)}</div>
                  <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: STATUS_COLOR[p.status] || 'var(--as-text-tertiary)' }}>{p.status}</div>
                </div>
              </div>
            ))}
        </>
      )}
    </div>
  );
}

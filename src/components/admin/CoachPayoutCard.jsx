import { ChevronRight } from 'lucide-react';
import { formatCurrency } from '../../lib/formatters';

const METHOD = { venmo: 'Venmo', zelle: 'Zelle', cash: 'Cash', check: 'Check', stripe: 'Card/Stripe', other: 'Other' };
const initials = (name) => (name || '?').split(/\s+/).filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase();

// Per-coach SUMMARY row for Financials → Coaches. Tap → the coach detail
// route (sessions behind owed + payouts + actions). Rated coaches headline
// the balance (owed − paid); unrated coaches show recorded pay.
export default function CoachPayoutCard({ coach, onOpen }) {
  const rated = coach.rateCents > 0;
  const balance = coach.balanceCents;

  return (
    <button type="button" onClick={() => onOpen?.(coach)} className="as-press"
      style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '12px 14px', minHeight: 44, marginBottom: 8, backgroundColor: 'var(--as-bg-card)', borderRadius: 10, border: '1px solid var(--as-border-default)', cursor: 'pointer', textAlign: 'left' }}>
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
            <div style={{ fontSize: 11, color: 'var(--as-text-tertiary)' }}>{balance > 0 ? 'still owed' : 'settled'}</div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--as-text-primary)' }}>{formatCurrency(coach.paidCents + coach.pendingCents)}</div>
            <div style={{ fontSize: 11, color: 'var(--as-text-tertiary)' }}>{formatCurrency(coach.paidCents)} paid</div>
          </>
        )}
      </div>
      <ChevronRight size={18} strokeWidth={1.75} color="var(--as-text-tertiary)" style={{ flexShrink: 0 }} />
    </button>
  );
}

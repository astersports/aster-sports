import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { formatCurrency } from '../../lib/formatters';

const METHOD = { venmo: 'Venmo', zelle: 'Zelle', cash: 'Cash', check: 'Check', stripe: 'Stripe', other: 'Other' };
const STATUS_COLOR = { pending: 'var(--as-warning)', paid: 'var(--as-success)', disputed: 'var(--as-danger)' };

const initials = (name) => (name || '?').split(/\s+/).filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
const dateLabel = (iso) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/New_York' });

// Per-coach expandable payout card for Financials → Coaches. Header shows the
// coach (avatar initials + name), payout count, and the season total with a
// paid/pending split; tap to expand the individual payout rows.
export default function CoachPayoutCard({ coach }) {
  const [open, setOpen] = useState(false);
  const total = coach.paidCents + coach.pendingCents;

  return (
    <div style={{ backgroundColor: 'var(--as-bg-card)', borderRadius: 10, border: '1px solid var(--as-border-default)', overflow: 'hidden', marginBottom: 8 }}>
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="as-press"
        style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '12px 14px', minHeight: 44, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
        <div style={{ width: 36, height: 36, borderRadius: 9999, flexShrink: 0, backgroundColor: 'var(--as-accent-soft)', color: 'var(--as-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }}>
          {initials(coach.name)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--as-text-primary)' }}>{coach.name}</div>
          <div style={{ fontSize: 12, color: 'var(--as-text-tertiary)' }}>{coach.rows.length} payout{coach.rows.length === 1 ? '' : 's'}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--as-text-primary)' }}>{formatCurrency(total)}</div>
          <div style={{ fontSize: 11, color: 'var(--as-text-tertiary)' }}>
            {formatCurrency(coach.paidCents)} paid{coach.pendingCents > 0 ? ` · ${formatCurrency(coach.pendingCents)} pending` : ''}
          </div>
        </div>
        <ChevronDown size={18} strokeWidth={1.75} color="var(--as-text-tertiary)" style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 200ms ease-out' }} />
      </button>
      {open && coach.rows.map((p) => (
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
    </div>
  );
}

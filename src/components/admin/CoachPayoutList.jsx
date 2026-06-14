import { formatCurrency } from '../../lib/formatters';
import Label from '../shared/Label';

// Coach payout ledger, split (PR-3, DR-F2). Two groups by the Migration-E-safe
// discriminator source_assignments IS NULL:
//   - Settled: payouts that settled tracked sessions (source_assignments populated)
//     — show the session count so they read as "paid for N sessions".
//   - Prior: pre-tracking lump payouts (source_assignments NULL) — kept visibly
//     separate so prior money is never confused with a session settlement.
// Tap a row → CoachPayoutEditSheet (which locks settled payouts, per the audit).
const METHOD = { venmo: 'Venmo', zelle: 'Zelle', cash: 'Cash', check: 'Check', stripe: 'Card/Stripe', other: 'Other' };
const STATUS_COLOR = { paid: 'var(--as-success)', pending: 'var(--as-warning)', disputed: 'var(--as-danger)' };
const NY = 'America/New_York';
const dateLabel = (iso) => (iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: NY }) : '—');
const CARD = { backgroundColor: 'var(--as-bg-card)', borderRadius: 10, border: '1px solid var(--as-border-default)', overflow: 'hidden', marginTop: 6 };
const EMPTY = { padding: 16, textAlign: 'center', color: 'var(--as-text-tertiary)', fontSize: 13 };
const paidSum = (rows) => rows.reduce((n, p) => n + (p.status === 'paid' ? p.amount_cents : 0), 0);

function PayoutRow({ p, onEdit, topBorder }) {
  const n = p.source_assignments?.length || 0;
  return (
    <button type="button" onClick={() => onEdit(p)} className="as-press" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '10px 14px', borderTop: topBorder ? '1px solid var(--as-border-subtle)' : 'none', borderLeft: 'none', borderRight: 'none', borderBottom: 'none', background: 'none', cursor: 'pointer', textAlign: 'left' }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--as-text-primary)' }}>{dateLabel(p.paid_at || p.created_at)}</div>
        <div style={{ fontSize: 12, color: 'var(--as-text-tertiary)' }}>{METHOD[p.payment_method] || 'Not specified'}{n ? ` · ${n} session${n === 1 ? '' : 's'}` : ''}</div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--as-text-primary)' }}>{formatCurrency(p.amount_cents)}</div>
        <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: STATUS_COLOR[p.status] || 'var(--as-text-tertiary)' }}>{p.status}</div>
      </div>
    </button>
  );
}

export default function CoachPayoutList({ payouts, onEdit }) {
  if (!payouts.length) {
    return (<><div style={{ marginTop: 16 }}><Label>Payouts</Label></div><div style={CARD}><div style={EMPTY}>No payouts recorded.</div></div></>);
  }
  const settled = payouts.filter((p) => p.source_assignments?.length);
  const prior = payouts.filter((p) => !p.source_assignments?.length);
  return (
    <>
      {settled.length > 0 && (
        <>
          <div style={{ marginTop: 16 }}><Label>Settled · {formatCurrency(paidSum(settled))}</Label></div>
          <div style={CARD}>{settled.map((p, i) => <PayoutRow key={p.id} p={p} onEdit={onEdit} topBorder={i > 0} />)}</div>
        </>
      )}
      {prior.length > 0 && (
        <>
          <div style={{ marginTop: 16, display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
            <Label>Prior payouts · {formatCurrency(paidSum(prior))}</Label>
            <span style={{ fontSize: 11, color: 'var(--as-text-tertiary)' }}>before settlement tracking</span>
          </div>
          <div style={CARD}>{prior.map((p, i) => <PayoutRow key={p.id} p={p} onEdit={onEdit} topBorder={i > 0} />)}</div>
        </>
      )}
    </>
  );
}

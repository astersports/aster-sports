import { useCoachPayouts } from '../../hooks/useCoachPayouts';
import { formatCurrency } from '../../lib/formatters';
import CoachPayoutCard from './CoachPayoutCard';
import LoadingSkeleton from '../shared/LoadingSkeleton';

// Financials → Coaches segment. Grouped per coach (name + season total +
// paid/pending split), each expandable to its payout rows. Season-scoped.
export default function CoachPayoutsSection({ orgId, seasonId }) {
  const { coaches, loading } = useCoachPayouts(orgId, seasonId);

  if (loading) return <LoadingSkeleton variant="card" count={2} />;

  if (coaches.length === 0) {
    return (
      <div style={{ padding: 20, textAlign: 'center', backgroundColor: 'var(--as-bg-card)', borderRadius: 10, border: '1px solid var(--as-border-default)', color: 'var(--as-text-tertiary)', fontSize: 13 }}>
        No coach payouts for this season yet. When coaching session payments are logged, they appear here.
      </div>
    );
  }

  const totalPaid = coaches.reduce((s, c) => s + c.paidCents, 0);
  const totalPending = coaches.reduce((s, c) => s + c.pendingCents, 0);

  return (
    <>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <div style={{ flex: 1, padding: '10px 12px', backgroundColor: 'var(--as-bg-card)', borderRadius: 10, border: '1px solid var(--as-border-default)' }}>
          <div style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--as-text-tertiary)' }}>Paid</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--as-success)' }}>{formatCurrency(totalPaid)}</div>
        </div>
        <div style={{ flex: 1, padding: '10px 12px', backgroundColor: 'var(--as-bg-card)', borderRadius: 10, border: '1px solid var(--as-border-default)' }}>
          <div style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--as-text-tertiary)' }}>Pending</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: totalPending > 0 ? 'var(--as-warning)' : 'var(--as-text-primary)' }}>{formatCurrency(totalPending)}</div>
        </div>
      </div>
      {coaches.map((c) => <CoachPayoutCard key={c.userId} coach={c} />)}
    </>
  );
}

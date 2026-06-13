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

  const totalOwed = coaches.reduce((s, c) => s + c.owedCents, 0);
  const totalPaid = coaches.reduce((s, c) => s + c.paidCents, 0);
  const balance = totalOwed - totalPaid;

  return (
    <>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {totalOwed > 0 && (
          <div style={{ flex: 1, padding: '10px 12px', backgroundColor: 'var(--as-bg-card)', borderRadius: 10, border: '1px solid var(--as-border-default)' }}>
            <div style={STAT_LABEL}>Owed</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--as-text-primary)' }}>{formatCurrency(totalOwed)}</div>
          </div>
        )}
        <div style={{ flex: 1, padding: '10px 12px', backgroundColor: 'var(--as-bg-card)', borderRadius: 10, border: '1px solid var(--as-border-default)' }}>
          <div style={STAT_LABEL}>Paid</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--as-success)' }}>{formatCurrency(totalPaid)}</div>
        </div>
        {totalOwed > 0 && (
          <div style={{ flex: 1, padding: '10px 12px', backgroundColor: 'var(--as-bg-card)', borderRadius: 10, border: '1px solid var(--as-border-default)' }}>
            <div style={STAT_LABEL}>Balance</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: balance > 0 ? 'var(--as-danger)' : 'var(--as-success)' }}>{formatCurrency(Math.abs(balance))}</div>
          </div>
        )}
      </div>
      {coaches.map((c) => <CoachPayoutCard key={c.userId} coach={c} />)}
    </>
  );
}

const STAT_LABEL = { fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--as-text-tertiary)' };

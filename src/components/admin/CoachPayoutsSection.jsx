import { useNavigate } from 'react-router-dom';
import { useCoachPayouts } from '../../hooks/useCoachPayouts';
import { formatCurrency } from '../../lib/formatters';
import CoachPayoutCard from './CoachPayoutCard';
import LoadingSkeleton from '../shared/LoadingSkeleton';

// Financials → Coaches segment. Owed + Paid totals (never netted, PR-1/DR-F1) +
// a per-coach summary card; tap a coach → the coach detail route (sessions behind
// owed + payouts + Pay-settings/Record-payout actions).
export default function CoachPayoutsSection({ orgId, seasonId }) {
  const { coaches, loading } = useCoachPayouts(orgId);
  const navigate = useNavigate();

  if (loading) return <LoadingSkeleton variant="card" count={2} />;

  if (coaches.length === 0) {
    return (
      <div style={{ padding: 20, textAlign: 'center', backgroundColor: 'var(--as-bg-card)', borderRadius: 10, border: '1px solid var(--as-border-default)', color: 'var(--as-text-tertiary)', fontSize: 13 }}>
        No coaches set up for this season yet. Assign a coach to a team to track their pay.
      </div>
    );
  }

  const totalOwed = coaches.reduce((s, c) => s + c.owedCents, 0);
  const totalPaid = coaches.reduce((s, c) => s + c.paidCents, 0);

  return (
    <>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {totalOwed > 0 && (
          <div style={STAT}><div style={STAT_LABEL}>Owed now</div><div style={{ ...STAT_NUM, color: 'var(--as-warning)' }}>{formatCurrency(totalOwed)}</div></div>
        )}
        <div style={STAT}><div style={STAT_LABEL}>Paid</div><div style={{ ...STAT_NUM, color: 'var(--as-success)' }}>{formatCurrency(totalPaid)}</div></div>
      </div>
      {coaches.map((c) => (
        <CoachPayoutCard key={c.userId} coach={c} onOpen={() => navigate(`/admin/financials/coach/${c.userId}?season=${seasonId}`)} />
      ))}
    </>
  );
}

const STAT = { flex: 1, padding: '10px 12px', backgroundColor: 'var(--as-bg-card)', borderRadius: 10, border: '1px solid var(--as-border-default)' };
const STAT_LABEL = { fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--as-text-tertiary)' };
const STAT_NUM = { fontSize: 18, fontWeight: 700 };

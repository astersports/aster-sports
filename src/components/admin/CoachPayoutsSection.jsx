import { useState } from 'react';
import { useCoachPayouts } from '../../hooks/useCoachPayouts';
import { formatCurrency } from '../../lib/formatters';
import CoachPayoutCard from './CoachPayoutCard';
import CoachRateSheet from './CoachRateSheet';
import RecordCoachPayoutForm from './RecordCoachPayoutForm';
import LoadingSkeleton from '../shared/LoadingSkeleton';

// Financials → Coaches segment. Per coach: owed (rate × sessions) vs paid →
// balance, expandable to payout rows, with Set-rate + Record-payout actions.
export default function CoachPayoutsSection({ orgId, seasonId }) {
  const { coaches, loading, refetch } = useCoachPayouts(orgId, seasonId);
  const [rateCoach, setRateCoach] = useState(null);
  const [payoutCoach, setPayoutCoach] = useState(null);

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
  const balance = totalOwed - totalPaid;

  return (
    <>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {totalOwed > 0 && (
          <div style={STAT}><div style={STAT_LABEL}>Owed</div><div style={{ ...STAT_NUM, color: 'var(--as-text-primary)' }}>{formatCurrency(totalOwed)}</div></div>
        )}
        <div style={STAT}><div style={STAT_LABEL}>Paid</div><div style={{ ...STAT_NUM, color: 'var(--as-success)' }}>{formatCurrency(totalPaid)}</div></div>
        {totalOwed > 0 && (
          <div style={STAT}><div style={STAT_LABEL}>Balance</div><div style={{ ...STAT_NUM, color: balance > 0 ? 'var(--as-danger)' : 'var(--as-success)' }}>{formatCurrency(Math.abs(balance))}</div></div>
        )}
      </div>
      {coaches.map((c) => <CoachPayoutCard key={c.userId} coach={c} onSetRate={setRateCoach} onRecordPayout={setPayoutCoach} />)}

      {rateCoach && (
        <CoachRateSheet coach={rateCoach} orgId={orgId} seasonId={seasonId}
          onClose={() => setRateCoach(null)} onSaved={() => { setRateCoach(null); refetch(); }} />
      )}
      {payoutCoach && (
        <RecordCoachPayoutForm coach={payoutCoach} orgId={orgId} seasonId={seasonId}
          onClose={() => setPayoutCoach(null)} onSaved={() => { setPayoutCoach(null); refetch(); }} />
      )}
    </>
  );
}

const STAT = { flex: 1, padding: '10px 12px', backgroundColor: 'var(--as-bg-card)', borderRadius: 10, border: '1px solid var(--as-border-default)' };
const STAT_LABEL = { fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--as-text-tertiary)' };
const STAT_NUM = { fontSize: 18, fontWeight: 700 };

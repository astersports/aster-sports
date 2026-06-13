import { lazy, Suspense, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useGoBack } from '../hooks/useGoBack';
import { useFamilyLedger } from '../hooks/useFamilyLedger';
import { formatCurrency } from '../lib/formatters';
import Label from '../components/shared/Label';

const RecordPaymentForm = lazy(() => import('../components/admin/RecordPaymentForm'));

const NY = 'America/New_York';
const TYPE = { payment: { label: 'Payment', color: 'var(--as-success)' }, refund: { label: 'Refund', color: 'var(--as-danger)' }, adjustment: { label: 'Adjustment', color: 'var(--as-info)' }, fee: { label: 'Fee', color: 'var(--as-text-secondary)' } };
const dateLabel = (iso) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: NY });

export default function FinancialFamilyDetailPage() {
  const { accountId } = useParams();
  const { orgId } = useAuth();
  const goBack = useGoBack('/admin/financials');
  const { account, balances, transactions, loading, refetch } = useFamilyLedger(orgId, accountId);
  const [recording, setRecording] = useState(false);

  const reversedIds = useMemo(() => new Set(transactions.filter((t) => t.reverses_transaction_id).map((t) => t.reverses_transaction_id)), [transactions]);

  if (loading) return <div style={{ padding: 32, textAlign: 'center', color: 'var(--as-text-tertiary)' }}>Loading…</div>;
  if (!account) return <div style={{ padding: 32, textAlign: 'center', color: 'var(--as-text-tertiary)' }}>Family not found.</div>;

  const name = account.guardians ? `${account.guardians.first_name} ${account.guardians.last_name}` : 'Unknown';
  const billed = balances?.billed_cents ?? 0;
  const paid = balances?.net_paid_cents ?? 0;
  const balance = balances?.balance_cents ?? 0;

  return (
    <div style={{ padding: '16px 16px 80px' }}>
      <button type="button" onClick={goBack} className="as-press" style={{ display: 'flex', alignItems: 'center', minHeight: 44, background: 'none', border: 'none', color: 'var(--as-accent)', fontSize: 15, fontWeight: 500, marginBottom: 12, padding: 0 }}>
        <ChevronLeft size={20} strokeWidth={1.75} /> Financials
      </button>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--as-text-primary)' }}>{name}</h1>
      <div style={{ display: 'flex', gap: 8, margin: '12px 0 16px' }}>
        <Stat label="Billed" value={formatCurrency(billed)} />
        <Stat label="Collected" value={formatCurrency(paid)} color="var(--as-success)" />
        <Stat label="Balance" value={formatCurrency(balance)} color={balance > 0 ? 'var(--as-danger)' : 'var(--as-success)'} />
      </div>

      <Label>Invoice</Label>
      <div style={CARD}>
        <Line k="Season fee" v={formatCurrency(account.season_fee_cents || 0)} />
        {(account.discount_cents || 0) > 0 && <Line k={`Discount${account.discount_reason ? ` · ${account.discount_reason}` : ''}`} v={`−${formatCurrency(account.discount_cents)}`} />}
        {account.notes && <Line k="Notes" v={account.notes} />}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
        <Label>Ledger</Label>
        <button type="button" onClick={() => setRecording(true)} className="as-press" style={{ minHeight: 36, padding: '0 12px', borderRadius: 10, border: '1.5px solid var(--as-accent)', backgroundColor: 'transparent', color: 'var(--as-accent)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          Record payment
        </button>
      </div>
      <div style={CARD}>
        {transactions.length === 0 ? <div style={EMPTY}>No transactions yet.</div> : transactions.map((t, i) => {
          const meta = TYPE[t.transaction_type] || TYPE.fee;
          const voided = reversedIds.has(t.id);
          const isReversal = !!t.reverses_transaction_id;
          return (
            <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderTop: i ? '1px solid var(--as-border-subtle)' : 'none', opacity: voided ? 0.5 : 1 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--as-text-primary)', textDecoration: voided ? 'line-through' : 'none' }}>
                  {isReversal ? 'Reversal' : meta.label}{t.payment_method ? ` · ${t.payment_method}` : ''}
                </div>
                <div style={{ fontSize: 12, color: 'var(--as-text-tertiary)' }}>{dateLabel(t.occurred_at)}{t.reference ? ` · ${t.reference}` : ''}{voided ? ' · voided' : ''}</div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: meta.color, textDecoration: voided ? 'line-through' : 'none' }}>{formatCurrency(t.amount_cents)}</div>
            </div>
          );
        })}
      </div>

      {recording && (
        <Suspense fallback={null}>
          <RecordPaymentForm account={{ id: account.id, guardians: account.guardians, balance }} onClose={() => setRecording(false)} onSaved={() => { setRecording(false); refetch(); }} />
        </Suspense>
      )}
    </div>
  );
}

const CARD = { backgroundColor: 'var(--as-bg-card)', borderRadius: 10, border: '1px solid var(--as-border-default)', overflow: 'hidden', marginTop: 6 };
const EMPTY = { padding: 16, textAlign: 'center', color: 'var(--as-text-tertiary)', fontSize: 13 };
function Stat({ label, value, color }) {
  return (
    <div style={{ flex: 1, padding: '10px 12px', backgroundColor: 'var(--as-bg-card)', borderRadius: 10, border: '1px solid var(--as-border-default)' }}>
      <div style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--as-text-tertiary)' }}>{label}</div>
      <div style={{ fontSize: 17, fontWeight: 700, color: color || 'var(--as-text-primary)' }}>{value}</div>
    </div>
  );
}
function Line({ k, v }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '10px 14px' }}>
      <span style={{ fontSize: 13, color: 'var(--as-text-secondary)' }}>{k}</span>
      <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--as-text-primary)', textAlign: 'right' }}>{v}</span>
    </div>
  );
}

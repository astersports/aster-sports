import { lazy, Suspense, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useGoBack } from '../hooks/useGoBack';
import { useFamilyLedger } from '../hooks/useFamilyLedger';
import { formatCurrency } from '../lib/formatters';
import Label from '../components/shared/Label';
import ConfirmDialog from '../components/shared/ConfirmDialog';

const RecordPaymentForm = lazy(() => import('../components/admin/RecordPaymentForm'));
const AddChargeSheet = lazy(() => import('../components/admin/AddChargeSheet'));

const NY = 'America/New_York';
const TYPE = { payment: { label: 'Payment', color: 'var(--as-success)' }, refund: { label: 'Refund', color: 'var(--as-danger)' }, adjustment: { label: 'Adjustment', color: 'var(--as-info)' }, fee: { label: 'Fee', color: 'var(--as-text-secondary)' } };
const dateLabel = (iso) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: NY });

export default function FinancialFamilyDetailPage() {
  const { accountId } = useParams();
  const { orgId, user } = useAuth();
  const goBack = useGoBack('/admin/financials');
  const { account, balances, transactions, loading, error, refetch } = useFamilyLedger(orgId, accountId);
  const [recording, setRecording] = useState(false);
  const [charging, setCharging] = useState(false);
  const [voidTxn, setVoidTxn] = useState(null);
  const [voidErr, setVoidErr] = useState(null);
  const voidingRef = useRef(false);

  const reversedIds = useMemo(() => new Set(transactions.filter((t) => t.reverses_transaction_id).map((t) => t.reverses_transaction_id)), [transactions]);

  // Append-only: void = a reversing insert. Surface failure (don't report
  // success): keep the dialog open + show the error, refetch only on success.
  // voidingRef blocks a double-tap (the unique index on reverses_transaction_id
  // would reject the 2nd, but we shouldn't fire it).
  const doVoid = async (t) => {
    if (voidingRef.current) return;
    voidingRef.current = true; setVoidErr(null);
    const { error } = await supabase.from('financial_transactions').insert({
      account_id: accountId, org_id: orgId, transaction_type: t.transaction_type, amount_cents: t.amount_cents,
      reverses_transaction_id: t.id, occurred_at: new Date().toISOString(), recorded_by: user.id, notes: 'Void',
    });
    voidingRef.current = false;
    if (error) { console.error('void transaction:', error.message); setVoidErr('Looks like that didn’t go through — it may already be voided. Try again?'); return; }
    setVoidTxn(null); refetch();
  };

  if (loading) return <div style={{ padding: 32, textAlign: 'center', color: 'var(--as-text-tertiary)' }}>Loading…</div>;
  if (error) return <div style={{ padding: 32, textAlign: 'center', color: 'var(--as-text-tertiary)' }}>Couldn&rsquo;t load this family&rsquo;s balance. Try again in a moment.</div>;
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

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Label>Ledger</Label>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={() => setCharging(true)} className="as-press" style={ACTION_BTN}>Add charge</button>
          <button type="button" onClick={() => setRecording(true)} className="as-press" style={{ ...ACTION_BTN, border: 'none', backgroundColor: 'var(--as-accent)', color: 'var(--as-text-inverse)' }}>Record payment</button>
        </div>
      </div>
      <div style={CARD}>
        {transactions.length === 0 ? <div style={EMPTY}>No transactions yet.</div> : transactions.map((t, i) => {
          const meta = TYPE[t.transaction_type] || TYPE.fee;
          const voided = reversedIds.has(t.id);
          const isReversal = !!t.reverses_transaction_id;
          return (
            <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, padding: '12px 14px', borderTop: i ? '1px solid var(--as-border-subtle)' : 'none', opacity: voided ? 0.5 : 1 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--as-text-primary)', textDecoration: voided ? 'line-through' : 'none' }}>
                  {isReversal ? 'Reversal' : meta.label}{t.payment_method ? ` · ${t.payment_method}` : ''}
                </div>
                <div style={{ fontSize: 12, color: 'var(--as-text-tertiary)' }}>{dateLabel(t.occurred_at)}{t.reference ? ` · ${t.reference}` : ''}{voided ? ' · voided' : ''}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                {!voided && !isReversal && (
                  <button type="button" onClick={() => setVoidTxn(t)} className="as-press" style={{ minHeight: 32, padding: '0 8px', borderRadius: 8, border: '1px solid var(--as-border-default)', backgroundColor: 'transparent', color: 'var(--as-text-tertiary)', fontSize: 11, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer' }}>Void</button>
                )}
                <div style={{ fontSize: 14, fontWeight: 600, color: meta.color, textDecoration: voided ? 'line-through' : 'none' }}>{formatCurrency(t.amount_cents)}</div>
              </div>
            </div>
          );
        })}
      </div>

      <Suspense fallback={null}>
        {recording && <RecordPaymentForm account={{ id: account.id, guardians: account.guardians, balance }} onClose={() => setRecording(false)} onSaved={() => { setRecording(false); refetch(); }} />}
        {charging && <AddChargeSheet accountId={account.id} orgId={orgId} onClose={() => setCharging(false)} onSaved={() => { setCharging(false); refetch(); }} />}
      </Suspense>
      {voidTxn && (
        <ConfirmDialog title="Void this transaction?" destructive confirmLabel="Void"
          message={`Posts a reversing entry for ${TYPE[voidTxn.transaction_type]?.label || 'this'} · ${formatCurrency(voidTxn.amount_cents)}. The original stays on the ledger, struck through.${voidErr ? `\n\n${voidErr}` : ''}`}
          onConfirm={() => doVoid(voidTxn)} onCancel={() => { setVoidTxn(null); setVoidErr(null); }} />
      )}
    </div>
  );
}

const CARD = { backgroundColor: 'var(--as-bg-card)', borderRadius: 10, border: '1px solid var(--as-border-default)', overflow: 'hidden', marginTop: 6 };
const EMPTY = { padding: 16, textAlign: 'center', color: 'var(--as-text-tertiary)', fontSize: 13 };
const ACTION_BTN = { minHeight: 36, padding: '0 12px', borderRadius: 10, border: '1.5px solid var(--as-accent)', backgroundColor: 'transparent', color: 'var(--as-accent)', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' };
function Stat({ label, value, color }) {
  return (
    <div style={{ flex: 1, padding: '10px 12px', backgroundColor: 'var(--as-bg-card)', borderRadius: 10, border: '1px solid var(--as-border-default)' }}>
      <div style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--as-text-tertiary)' }}>{label}</div>
      <div style={{ fontSize: 17, fontWeight: 700, color: color || 'var(--as-text-primary)' }}>{value}</div>
    </div>
  );
}

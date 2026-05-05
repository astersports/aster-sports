import { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, Upload } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import Label from '../components/shared/Label';
import RecordPaymentForm from '../components/admin/RecordPaymentForm';

export default function FinancialDashboardPage() {
  const { orgId } = useAuth();
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payingAccount, setPayingAccount] = useState(null);

  const fetchData = useCallback(() => {
    if (!orgId) return;
    Promise.all([
      supabase.from('financial_accounts').select('*, guardians(first_name, last_name)').eq('org_id', orgId),
      supabase.from('financial_transactions').select('*').eq('org_id', orgId).order('occurred_at', { ascending: false }),
    ]).then(([aRes, tRes]) => {
      setAccounts(aRes.data || []);
      setTransactions(tRes.data || []);
      setLoading(false);
    });
  }, [orgId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const stats = useMemo(() => {
    let billed = 0, paid = 0, fees = 0;
    const balances = {};
    accounts.forEach((a) => { billed += a.season_fee_cents - a.discount_cents; balances[a.id] = a.season_fee_cents - a.discount_cents; });
    transactions.forEach((t) => {
      if (t.transaction_type === 'payment') { paid += t.amount_cents; fees += (t.processing_fee_cents || 0); balances[t.account_id] = (balances[t.account_id] || 0) - t.amount_cents; }
      if (t.transaction_type === 'refund') { paid -= t.amount_cents; balances[t.account_id] = (balances[t.account_id] || 0) + t.amount_cents; }
    });
    const outstanding = billed - paid;
    const net = paid - fees;
    const families = accounts.filter((a) => (balances[a.id] || 0) > 0).length;
    return { billed, paid, outstanding, net, fees, families, pct: billed > 0 ? Math.round((paid / billed) * 100) : 0 };
  }, [accounts, transactions]);

  const fmt = (cents) => `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

  if (loading) return <div style={{ padding: 32, textAlign: 'center', color: 'var(--em-text-tertiary)' }}>Loading…</div>;

  return (
    <div style={{ padding: '16px 16px 80px' }}>
      <button type="button" onClick={() => navigate(-1)} className="sf-press" style={{ display: 'flex', alignItems: 'center', minHeight: 44, background: 'none', border: 'none', color: 'var(--em-accent)', fontSize: 15, fontWeight: 500, marginBottom: 12, padding: 0 }}>
        <ChevronLeft size={20} strokeWidth={1.75} /> Back
      </button>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--em-text-primary)' }}>Financials</h1>
        <Link to="/admin/financials/import" className="sf-press" style={{ display: 'flex', alignItems: 'center', gap: 4, minHeight: 36, padding: '0 12px', borderRadius: 10, fontSize: 13, fontWeight: 500, color: 'var(--em-accent)', border: '1.5px solid var(--em-accent)', textDecoration: 'none' }}>
          <Upload size={14} strokeWidth={1.75} /> Import
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 24 }}>
        <StatCard label="Outstanding" value={fmt(stats.outstanding)} sub={`${stats.families} families`} color="var(--em-danger)" />
        <StatCard label="Collected" value={fmt(stats.paid)} sub={`${stats.pct}% of expected`} color="var(--em-success)" />
        <StatCard label="Net to Bank" value={fmt(stats.net)} sub={`After ${fmt(stats.fees)} fees`} color="var(--em-text-primary)" />
        <StatCard label="Families" value={accounts.length} sub="accounts total" color="var(--em-text-primary)" />
      </div>

      <Label>Families</Label>
      <div style={{ backgroundColor: 'var(--em-bg-card)', borderRadius: 10, border: '1px solid var(--em-border-default)', overflow: 'hidden' }}>
        {accounts.length === 0 && <div style={{ padding: 16, textAlign: 'center', color: 'var(--em-text-tertiary)', fontSize: 13 }}>No accounts set up yet.</div>}
        {accounts.map((a, i) => {
          const paid = transactions.filter((t) => t.account_id === a.id && t.transaction_type === 'payment').reduce((s, t) => s + t.amount_cents, 0);
          const balance = (a.season_fee_cents - a.discount_cents) - paid;
          const name = a.guardians ? `${a.guardians.first_name} ${a.guardians.last_name}` : 'Unknown';
          return (
            <button key={a.id} type="button" onClick={() => balance > 0 && setPayingAccount(a)} className="sf-press" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderTop: i === 0 ? 'none' : '1px solid var(--em-border-subtle)', minHeight: 44, width: '100%', background: 'none', border: 'none', borderTopStyle: i ? 'solid' : 'none', borderTopWidth: i ? 1 : 0, borderTopColor: 'var(--em-border-subtle)', textAlign: 'left', cursor: balance > 0 ? 'pointer' : 'default' }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--em-text-primary)' }}>{name}</div>
                <div style={{ fontSize: 12, color: 'var(--em-text-tertiary)' }}>Fee: {fmt(a.season_fee_cents)}{a.discount_cents > 0 ? ` · Discount: ${fmt(a.discount_cents)}` : ''}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: balance > 0 ? 'var(--em-danger)' : 'var(--em-success)' }}>{balance > 0 ? fmt(balance) : 'Paid'}</div>
                {balance > 0 && <div style={{ fontSize: 11, color: 'var(--em-text-tertiary)' }}>Tap to record</div>}
              </div>
            </button>
          );
        })}
      </div>

      {payingAccount && (
        <RecordPaymentForm account={payingAccount} onClose={() => setPayingAccount(null)} onSaved={() => { setPayingAccount(null); fetchData(); }} />
      )}
    </div>
  );
}

function StatCard({ label, value, sub, color }) {
  return (
    <div style={{ padding: 16, backgroundColor: 'var(--em-bg-card)', borderRadius: 10, border: '1px solid var(--em-border-default)', boxShadow: 'var(--em-shadow-sm)' }}>
      <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--em-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color, marginTop: 4 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--em-text-tertiary)', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import Label from '../components/shared/Label';

export default function FinancialDashboardPage() {
  const { orgId } = useAuth();
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

  const stats = useMemo(() => {
    let billed = 0, paid = 0;
    const balances = {};
    accounts.forEach((a) => {
      billed += a.season_fee_cents - a.discount_cents;
      balances[a.id] = a.season_fee_cents - a.discount_cents;
    });
    transactions.forEach((t) => {
      if (t.transaction_type === 'payment') { paid += t.amount_cents; balances[t.account_id] = (balances[t.account_id] || 0) - t.amount_cents; }
      if (t.transaction_type === 'refund') { paid -= t.amount_cents; balances[t.account_id] = (balances[t.account_id] || 0) + t.amount_cents; }
    });
    const outstanding = billed - paid;
    const families = accounts.filter((a) => (balances[a.id] || 0) > 0).length;
    return { billed, paid, outstanding, families, pct: billed > 0 ? Math.round((paid / billed) * 100) : 0 };
  }, [accounts, transactions]);

  const fmt = (cents) => `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

  if (loading) return <div style={{ padding: 32, textAlign: 'center', color: 'var(--em-text-tertiary)' }}>Loading…</div>;

  return (
    <div style={{ padding: '16px 16px 80px' }}>
      <button type="button" onClick={() => navigate(-1)} className="sf-press" style={{ display: 'flex', alignItems: 'center', minHeight: 44, background: 'none', border: 'none', color: 'var(--em-accent)', fontSize: 15, fontWeight: 500, marginBottom: 12, padding: 0 }}>
        <ChevronLeft size={20} strokeWidth={1.75} /> Back
      </button>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--em-text-primary)', marginBottom: 16 }}>Financials</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 24 }}>
        <StatCard label="Outstanding" value={fmt(stats.outstanding)} sub={`${stats.families} families`} color="var(--em-danger)" />
        <StatCard label="Collected" value={fmt(stats.paid)} sub={`${stats.pct}% of expected`} color="var(--em-success)" />
      </div>

      <Label>Families</Label>
      <div style={{ backgroundColor: 'var(--em-bg-card)', borderRadius: 10, border: '1px solid var(--em-border-default)', overflow: 'hidden' }}>
        {accounts.length === 0 && <div style={{ padding: 16, textAlign: 'center', color: 'var(--em-text-tertiary)', fontSize: 13 }}>No accounts set up yet.</div>}
        {accounts.map((a, i) => {
          const paid = transactions.filter((t) => t.account_id === a.id && t.transaction_type === 'payment').reduce((s, t) => s + t.amount_cents, 0);
          const balance = (a.season_fee_cents - a.discount_cents) - paid;
          const name = a.guardians ? `${a.guardians.first_name} ${a.guardians.last_name}` : 'Unknown';
          return (
            <div key={a.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderTop: i === 0 ? 'none' : '1px solid var(--em-border-subtle)', minHeight: 44 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--em-text-primary)' }}>{name}</div>
                <div style={{ fontSize: 12, color: 'var(--em-text-tertiary)' }}>Fee: {fmt(a.season_fee_cents)}{a.discount_cents > 0 ? ` · Discount: ${fmt(a.discount_cents)}` : ''}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: balance > 0 ? 'var(--em-danger)' : 'var(--em-success)' }}>{balance > 0 ? fmt(balance) : 'Paid'}</div>
              </div>
            </div>
          );
        })}
      </div>
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

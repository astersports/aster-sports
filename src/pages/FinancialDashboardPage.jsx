import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, Upload } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import FamilyBalanceList from '../components/admin/FamilyBalanceList';
import RecordPaymentForm from '../components/admin/RecordPaymentForm';
import CoachPayoutsSection from '../components/admin/CoachPayoutsSection';

export default function FinancialDashboardPage() {
  const { orgId } = useAuth();
  const navigate = useNavigate();
  const [seasons, setSeasons] = useState([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState(null);
  const [data, setData] = useState(null);
  const [payingAccount, setPayingAccount] = useState(null);
  const fetchIdRef = useRef(0);

  useEffect(() => {
    if (!orgId) return;
    supabase.from('seasons').select('id, name, status').eq('org_id', orgId)
      .order('start_date', { ascending: false })
      .then(({ data: d }) => setSeasons(d || []));
  }, [orgId]);

  const seasonId = selectedSeasonId
    || seasons.find((s) => s.status === 'active')?.id
    || seasons[0]?.id
    || null;

  const refetch = useCallback(() => {
    if (!orgId || !seasonId) return;
    const id = ++fetchIdRef.current;
    Promise.all([
      supabase.from('financial_accounts').select('*, guardians(first_name, last_name, user_id)').eq('org_id', orgId).eq('season_id', seasonId),
      supabase.from('financial_transactions').select('*').eq('org_id', orgId).order('occurred_at', { ascending: false }),
    ]).then(([aRes, tRes]) => {
      if (id !== fetchIdRef.current) return;
      const accts = aRes.data || [];
      const acctIds = new Set(accts.map((a) => a.id));
      setData({ accounts: accts, transactions: (tRes.data || []).filter((t) => acctIds.has(t.account_id)) });
    });
  }, [orgId, seasonId]);

  useEffect(() => { refetch(); }, [refetch]);

  // Wave 4.8 hygiene PR #126 — stabilize derived state so the downstream
  // useMemo at `stats` actually memoizes. Without the wrapper memos,
  // `data?.accounts || []` returned a fresh empty array on every render
  // during the null-data phase, defeating the `stats` memo and forcing
  // its (heavy: 2 forEach loops over accounts + transactions) computation
  // to recompute on every render of this page.
  const accounts = useMemo(() => data?.accounts || [], [data]);
  const transactions = useMemo(() => data?.transactions || [], [data]);
  const loading = !data;

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
    const familiesOwing = accounts.filter((a) => (balances[a.id] || 0) > 0).length;
    return { billed, paid, outstanding, net, fees, familiesOwing, pct: billed > 0 ? Math.round((paid / billed) * 100) : 0 };
  }, [accounts, transactions]);

  const fmt = (cents) => `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  const currentSeason = seasons.find((s) => s.id === seasonId);

  if (loading && !seasonId) return <div style={{ padding: 32, textAlign: 'center', color: 'var(--em-text-tertiary)' }}>Loading…</div>;

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

      {seasons.length > 1 && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 16, overflowX: 'auto' }}>
          {seasons.map((s) => (
            <button key={s.id} type="button" onClick={() => setSelectedSeasonId(s.id)} className="sf-press" style={{
              minHeight: 36, padding: '0 14px', borderRadius: 9999, fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap',
              border: s.id === seasonId ? 'none' : '1px solid var(--em-border-default)',
              backgroundColor: s.id === seasonId ? 'var(--em-accent)' : 'var(--em-bg-card)',
              color: s.id === seasonId ? 'var(--em-text-inverse)' : 'var(--em-text-secondary)',
            }}>
              {s.name}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div style={{ padding: 32, textAlign: 'center', color: 'var(--em-text-tertiary)' }}>Loading…</div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 24 }}>
            <StatCard label="Outstanding" value={fmt(stats.outstanding)} sub={`${stats.familiesOwing} families`} color="var(--em-danger)" />
            <StatCard label="Collected" value={fmt(stats.paid)} sub={`${stats.pct}% of expected`} color="var(--em-success)">
              {stats.billed > 0 && (
                <div style={{ marginTop: 4, height: 4, borderRadius: 2, backgroundColor: 'var(--em-bg-secondary)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.min(100, Math.round((stats.paid / stats.billed) * 100))}%`, backgroundColor: 'var(--em-success)', borderRadius: 2 }} />
                </div>
              )}
            </StatCard>
            <StatCard label="Net to Bank" value={fmt(stats.net)} sub={`After ${fmt(stats.fees)} fees`} color="var(--em-text-primary)" />
            <StatCard label="Families" value={accounts.length} sub={currentSeason?.name || ''} color="var(--em-text-primary)" />
          </div>

          <FamilyBalanceList accounts={accounts} transactions={transactions} fmt={fmt} onRecordPayment={setPayingAccount}
            onNudge={(family) => {
              const uid = family.guardians?.user_id;
              navigate(uid ? `/messages?dm=${uid}` : '/messages');
            }} />
        </>
      )}

      <CoachPayoutsSection orgId={orgId} />

      {payingAccount && (
        <RecordPaymentForm account={payingAccount} onClose={() => setPayingAccount(null)} onSaved={() => { setPayingAccount(null); refetch(); }} />
      )}
    </div>
  );
}

function StatCard({ label, value, sub, color, children }) {
  return (
    <div style={{ padding: 16, backgroundColor: 'var(--em-bg-card)', borderRadius: 10, border: '1px solid var(--em-border-default)', boxShadow: 'var(--em-shadow-sm)' }}>
      <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--em-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color, marginTop: 4 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--em-text-tertiary)', marginTop: 2 }}>{sub}</div>}
      {children}
    </div>
  );
}

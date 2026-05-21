import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, Upload } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useSeasonFinancials } from '../hooks/useSeasonFinancials';
import FamilyBalanceList from '../components/admin/FamilyBalanceList';
import RecordPaymentForm from '../components/admin/RecordPaymentForm';
import CoachPayoutsSection from '../components/admin/CoachPayoutsSection';

export default function FinancialDashboardPage() {
  const { orgId } = useAuth();
  const navigate = useNavigate();
  const [seasons, setSeasons] = useState([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState(null);
  const [payingAccount, setPayingAccount] = useState(null);

  useEffect(() => {
    if (!orgId) return;
    // Frank-reported 2026-05-20 L99 v6 §5.1 B3: empty Winter 2025-26
    // tab was rendering despite no financial_accounts for that season.
    // Filter to seasons that actually have accounts so the tab strip
    // only shows what's clickable. Two-query approach (vs PostgREST
    // !inner) keeps the parent shape simple and the filter explicit.
    Promise.all([
      supabase.from('seasons').select('id, name, status').eq('org_id', orgId).order('start_date', { ascending: false }),
      supabase.from('financial_accounts').select('season_id').eq('org_id', orgId),
    ]).then(([seasonsRes, accountsRes]) => {
      const withAccounts = new Set((accountsRes.data || []).map((a) => a.season_id).filter(Boolean));
      setSeasons((seasonsRes.data || []).filter((s) => withAccounts.has(s.id)));
    });
  }, [orgId]);

  const seasonId = selectedSeasonId
    || seasons.find((s) => s.status === 'active')?.id
    || seasons[0]?.id
    || null;

  // Per anti-pattern #42 — single source of truth for financial
  // state across this page and admin-home's payment-overdue lane.
  // Previously inline at :57-69 here; extracted PR #303.
  const { accounts, balances, stats, loading, refetch } = useSeasonFinancials(orgId, seasonId);

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
              minHeight: 44, padding: '0 14px', borderRadius: 9999, fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap',
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

          <FamilyBalanceList accounts={accounts} balances={balances} fmt={fmt} onRecordPayment={setPayingAccount}
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

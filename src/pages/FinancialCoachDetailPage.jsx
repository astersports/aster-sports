import { lazy, Suspense, useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useGoBack } from '../hooks/useGoBack';
import { useCoachDetail } from '../hooks/useCoachDetail';
import { formatCurrency } from '../lib/formatters';
import Label from '../components/shared/Label';

const CoachRateSheet = lazy(() => import('../components/admin/CoachRateSheet'));
const RecordCoachPayoutForm = lazy(() => import('../components/admin/RecordCoachPayoutForm'));
const CoachSessionSheet = lazy(() => import('../components/admin/CoachSessionSheet'));
const CoachPayoutEditSheet = lazy(() => import('../components/admin/CoachPayoutEditSheet'));

const NY = 'America/New_York';
const METHOD = { venmo: 'Venmo', zelle: 'Zelle', cash: 'Cash', check: 'Check', stripe: 'Card/Stripe', other: 'Other' };
const STATUS_COLOR = { owed: 'var(--as-warning)', paid: 'var(--as-success)', excluded: 'var(--as-text-tertiary)', pending: 'var(--as-warning)', disputed: 'var(--as-danger)' };
const dateLabel = (iso) => (iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: NY }) : '—');

export default function FinancialCoachDetailPage() {
  const { userId } = useParams();
  const { orgId } = useAuth();
  const goBack = useGoBack('/admin/financials');
  const [searchParams] = useSearchParams();
  const [seasonId, setSeasonId] = useState(searchParams.get('season') || null);
  useEffect(() => {
    if (seasonId || !orgId) return;
    supabase.from('seasons').select('id').eq('org_id', orgId).eq('status', 'active').maybeSingle().then(({ data }) => setSeasonId(data?.id || null));
  }, [seasonId, orgId]);

  const { data, loading, refetch } = useCoachDetail(orgId, seasonId, userId);
  const [sheet, setSheet] = useState(null); // 'rate' | 'payout'
  const [editSession, setEditSession] = useState(null);
  const [editPayout, setEditPayout] = useState(null);

  if (loading || !seasonId) return <div style={{ padding: 32, textAlign: 'center', color: 'var(--as-text-tertiary)' }}>Loading…</div>;
  if (!data) return <div style={{ padding: 32, textAlign: 'center', color: 'var(--as-text-tertiary)' }}>Coach not found.</div>;

  const rated = data.rateCents > 0;

  return (
    <div style={{ padding: '16px 16px 80px' }}>
      <button type="button" onClick={goBack} className="as-press" style={{ display: 'flex', alignItems: 'center', minHeight: 44, background: 'none', border: 'none', color: 'var(--as-accent)', fontSize: 15, fontWeight: 500, marginBottom: 12, padding: 0 }}>
        <ChevronLeft size={20} strokeWidth={1.75} /> Financials
      </button>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--as-text-primary)' }}>{data.name}</h1>
      <div style={{ fontSize: 13, color: 'var(--as-text-tertiary)', marginTop: 2 }}>
        {rated ? `${formatCurrency(data.rateCents)}/session` : 'No rate set'}{data.defaultMethod ? ` · ${METHOD[data.defaultMethod] || data.defaultMethod}` : ''}
      </div>
      <div style={{ display: 'flex', gap: 8, margin: '12px 0 12px' }}>
        <Stat label="Owed" value={formatCurrency(data.owedCents)} />
        <Stat label="Paid" value={formatCurrency(data.paidCents)} color="var(--as-success)" />
        <Stat label="Balance" value={formatCurrency(data.balanceCents)} color={data.balanceCents > 0 ? 'var(--as-danger)' : 'var(--as-success)'} />
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button type="button" onClick={() => setSheet('rate')} className="as-press" style={{ flex: 1, minHeight: 40, borderRadius: 10, border: '1px solid var(--as-border-default)', backgroundColor: 'var(--as-bg-card)', color: 'var(--as-text-secondary)', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>Pay settings</button>
        <button type="button" onClick={() => setSheet('payout')} className="as-press" style={{ flex: 1, minHeight: 40, borderRadius: 10, border: 'none', backgroundColor: 'var(--as-accent)', color: 'var(--as-text-inverse)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Record payout</button>
      </div>

      <Label>Sessions ({data.sessions.length})</Label>
      <div style={CARD}>
        {data.sessions.length === 0 ? <div style={EMPTY}>No sessions assigned this season.</div> : data.sessions.map((s, i) => (
          <button type="button" key={s.id} onClick={() => setEditSession(s)} className="as-press" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '10px 14px', borderTop: i ? '1px solid var(--as-border-subtle)' : 'none', borderLeft: 'none', borderRight: 'none', borderBottom: 'none', background: 'none', cursor: 'pointer', textAlign: 'left' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--as-text-primary)' }}>{dateLabel(s.startAt)} · {s.teamName}</div>
              <div style={{ fontSize: 12, color: 'var(--as-text-tertiary)' }}>{s.title}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--as-text-primary)' }}>{formatCurrency(s.pay_cents)}</div>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: STATUS_COLOR[s.pay_status] || 'var(--as-text-tertiary)' }}>{s.pay_status}</div>
            </div>
          </button>
        ))}
      </div>

      <div style={{ marginTop: 16 }}><Label>Payouts ({data.payouts.length})</Label></div>
      <div style={CARD}>
        {data.payouts.length === 0 ? <div style={EMPTY}>No payouts recorded.</div> : data.payouts.map((p, i) => (
          <button type="button" key={p.id} onClick={() => setEditPayout(p)} className="as-press" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '10px 14px', borderTop: i ? '1px solid var(--as-border-subtle)' : 'none', borderLeft: 'none', borderRight: 'none', borderBottom: 'none', background: 'none', cursor: 'pointer', textAlign: 'left' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--as-text-primary)' }}>{dateLabel(p.paid_at || p.created_at)}</div>
              <div style={{ fontSize: 12, color: 'var(--as-text-tertiary)' }}>{METHOD[p.payment_method] || 'Not specified'}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--as-text-primary)' }}>{formatCurrency(p.amount_cents)}</div>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: STATUS_COLOR[p.status] || 'var(--as-text-tertiary)' }}>{p.status}</div>
            </div>
          </button>
        ))}
      </div>

      <Suspense fallback={null}>
        {sheet === 'rate' && <CoachRateSheet coach={data} orgId={orgId} seasonId={seasonId} onClose={() => setSheet(null)} onSaved={() => { setSheet(null); refetch(); }} />}
        {sheet === 'payout' && <RecordCoachPayoutForm coach={data} orgId={orgId} seasonId={seasonId} onClose={() => setSheet(null)} onSaved={() => { setSheet(null); refetch(); }} />}
        {editSession && <CoachSessionSheet session={editSession} onClose={() => setEditSession(null)} onSaved={() => { setEditSession(null); refetch(); }} />}
        {editPayout && <CoachPayoutEditSheet payout={editPayout} onClose={() => setEditPayout(null)} onSaved={() => { setEditPayout(null); refetch(); }} />}
      </Suspense>
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

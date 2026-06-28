import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useSeasonFinancials } from '../hooks/useSeasonFinancials';
import { useFamilyTeams } from '../hooks/useFamilyTeams';
import { useFunnelRevenue } from '../hooks/useFunnelRevenue';
import { formatCurrency } from '../lib/formatters';
import { useGoBack } from '../hooks/useGoBack';
import FamilyBalanceList from '../components/admin/FamilyBalanceList';
import FinancialSummaryCard from '../components/admin/FinancialSummaryCard';
import CoachPayoutsSection from '../components/admin/CoachPayoutsSection';
import SegmentedControl from '../components/shared/SegmentedControl';
// L99 enhancement components (src/components/financial/) — all additive.
import CollectionProgressBar from '../components/financial/CollectionProgressBar';
import OutstandingCallout from '../components/financial/OutstandingCallout';
import SeasonTabStrip from '../components/financial/SeasonTabStrip';
import FinancialStatChips from '../components/financial/FinancialStatChips';
import { FinancialDashboardSkeleton, FinancialErrorBanner, NoSeasonsState } from '../components/financial/FinancialStates';

export default function FinancialDashboardPage() {
  const { orgId } = useAuth();
  const navigate = useNavigate();
  const goBack = useGoBack();
  // ROSTER-2: arriving from the payment_overdue alert (?owing=1) lands on
  // the season that actually has owing families + pre-enables the filter.
  const [searchParams] = useSearchParams();
  const owingParam = searchParams.get('owing') === '1';
  const [seasons, setSeasons] = useState([]);
  const [owingSeasonIds, setOwingSeasonIds] = useState(() => new Set());
  const [selectedSeasonId, setSelectedSeasonId] = useState(null);
  const [segment, setSegment] = useState('families');

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
      supabase.from('family_balances').select('season_id, balance_cents').eq('org_id', orgId),
    ]).then(([seasonsRes, accountsRes, balancesRes]) => {
      const err = seasonsRes.error || accountsRes.error || balancesRes.error;
      if (err) console.error('FinancialDashboardPage seasons load:', err.message);
      const withAccounts = new Set((accountsRes.data || []).map((a) => a.season_id).filter(Boolean));
      setSeasons((seasonsRes.data || []).filter((s) => withAccounts.has(s.id)));
      setOwingSeasonIds(new Set((balancesRes.data || []).filter((r) => (Number(r.balance_cents) || 0) > 0).map((r) => r.season_id)));
    });
  }, [orgId]);

  const seasonId = selectedSeasonId
    || (owingParam ? seasons.find((s) => owingSeasonIds.has(s.id))?.id : null)
    || seasons.find((s) => s.status === 'active')?.id
    || seasons[0]?.id
    || null;

  // Per anti-pattern #42 — single source of truth for financial
  // state across this page and admin-home's payment-overdue lane.
  // Previously inline at :57-69 here; extracted PR #303.
  const { accounts, balances, byAccount, stats, loading, error, refetch } = useSeasonFinancials(orgId, seasonId);
  const { teamsByGuardian, teams: familyTeams, playersByTeam } = useFamilyTeams(orgId, seasonId);
  const funnel = useFunnelRevenue(orgId);

  const fmt = formatCurrency;  // shared helper (style:currency) — identical $X,XXX.00 output
  const currentSeason = seasons.find((s) => s.id === seasonId);

  if (loading && !seasonId) return <div style={{ padding: 32, textAlign: 'center', color: 'var(--as-text-tertiary)' }}>Loading…</div>;

  return (
    <main style={{ padding: '16px 16px 80px' }} aria-labelledby="financials-heading">
      <button type="button" onClick={goBack} className="as-press" aria-label="Go back" style={{ display: 'flex', alignItems: 'center', minHeight: 44, background: 'none', border: 'none', color: 'var(--as-accent)', fontSize: 15, fontWeight: 500, marginBottom: 12, padding: 0 }}>
        <ChevronLeft size={20} strokeWidth={1.75} aria-hidden="true" /> Back
      </button>
      <h1 id="financials-heading" style={{ fontSize: 20, fontWeight: 700, color: 'var(--as-text-primary)', marginBottom: 16 }}>Financials</h1>

      {/* E5: accessible, responsive season tablist with owing-dots (single
          source: the page's owingSeasonIds Set). */}
      {seasons.length > 1 && (
        <SeasonTabStrip seasons={seasons} seasonId={seasonId} owingSeasonIds={owingSeasonIds} onSelect={setSelectedSeasonId} />
      )}

      {/* E3: org with no billed season yet. */}
      {!loading && seasons.length === 0 && <NoSeasonsState />}

      {/* E2: money-load error (was silently swallowed by the hook). */}
      {error && !loading && <FinancialErrorBanner message={error} onRetry={refetch} />}

      {loading ? (
        <FinancialDashboardSkeleton />
      ) : seasons.length === 0 ? null : (
        <>
          {/* E6/E7: scope-labeled families-owing headline + a11y live region. */}
          <OutstandingCallout stats={stats} seasonName={currentSeason?.name} />

          <FinancialSummaryCard stats={stats} seasonName={currentSeason?.name} funnel={funnel} fmt={fmt} />

          {/* E1: Stripe-style season collection progress bar. */}
          <CollectionProgressBar stats={stats} />

          {/* E9/E10: at-a-glance KPI chips (familyCount = season accounts). */}
          <FinancialStatChips stats={stats} familyCount={accounts.length} />

          <div style={{ margin: '16px 0 12px' }}>
            <SegmentedControl label="Financials view" value={segment} onChange={setSegment}
              options={[{ value: 'families', label: 'Families' }, { value: 'coaches', label: 'Coaches' }]} />
          </div>

          {segment === 'families' ? (
            <FamilyBalanceList accounts={accounts} balances={balances} byAccount={byAccount} fmt={fmt} teamsByGuardian={teamsByGuardian} teams={familyTeams} playersByTeam={playersByTeam}
              onOpen={(family) => navigate(`/admin/financials/family/${family.id}`)}
              onNudge={(family) => {
                const uid = family.guardians?.user_id;
                navigate(uid ? `/messages?dm=${uid}` : '/messages');
              }} />
          ) : (
            <CoachPayoutsSection orgId={orgId} seasonId={seasonId} />
          )}
        </>
      )}
    </main>
  );
}

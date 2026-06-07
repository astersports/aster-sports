import { useAuth } from '../../context/AuthContext';
import { useProgramHealthMetrics } from '../../hooks/useProgramHealthMetrics';
import { useFamiliesOwingCount } from '../../hooks/useFamiliesOwingCount';
import { seasonProgress } from '../../lib/seasonProgress';

// AdminProgramHealth — the v2 "Program health" context card (shell contract
// v2, per HOME_RENDERS admin). A single context card: "{season} · Week X of Y"
// + a 4-KPI row (Players · Events · Collected · Out). Replaces the v1
// progress-bar ProgramHealthCard. Players + Collected from
// useProgramHealthMetrics, Events from the page (activities), Out from
// useFamiliesOwingCount (all-seasons).
const LABEL = {
  fontSize: 11, fontWeight: 600, letterSpacing: '0.1em',
  textTransform: 'uppercase', color: 'var(--as-text-meta)', marginBottom: 8, padding: '0 2px',
};
const CARD = {
  backgroundColor: 'var(--as-bg-card)', border: '1px solid var(--as-border-default)',
  borderTop: '3px solid var(--as-accent)', borderRadius: 12,
  boxShadow: 'var(--as-shadow-sm)', padding: '12px 13px',
};
const KPI = { flex: 1, textAlign: 'center', backgroundColor: 'var(--as-bg-secondary)', borderRadius: 7, padding: '8px 3px' };

function shortDollars(cents) {
  const d = Math.round((cents || 0) / 100);
  return d >= 1000 ? `$${(d / 1000).toFixed(1)}k` : `$${d}`;
}

export default function AdminProgramHealth({ season, nowMs, eventsCount = 0 }) {
  const { orgId } = useAuth();
  const { paymentPct, playersCount, loading } = useProgramHealthMetrics(orgId, season?.id);
  const { totalCents, loading: owingLoading } = useFamiliesOwingCount(orgId);
  if (!season) return null;
  const prog = seasonProgress(season, nowMs);
  // BUG-H1 (AP#63): "Collected" is THIS-SEASON (useProgramHealthMetrics(season.id))
  // while "Out" is ALL-SEASONS (useFamiliesOwingCount — matches the
  // payment_overdue alert scope, HOME-2). Both are honest; the fix is to LABEL
  // the scope on each KPI so they don't read as a contradiction (e.g. "Collected
  // 100%" beside "Out $1.3k" for a prior-season debtor), NOT to re-scope "Out".
  // BUG-H3: "Out" is gated on its OWN loading (owingLoading), not the metrics
  // loading, so it never flashes "$0" before family_balances resolves.
  const kpis = [
    { v: playersCount, l: 'Players', scope: 'season' },
    { v: eventsCount, l: 'Events', scope: 'season' },
    { v: paymentPct != null ? `${paymentPct}%` : '—', l: 'Collected', scope: 'season', good: paymentPct === 100 },
    { v: shortDollars(totalCents), l: 'Out', scope: 'all-time', loading: owingLoading },
  ];
  return (
    <section className="min-w-0" aria-label="Program health">
      <div style={LABEL}>Program health</div>
      <div style={CARD}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--as-text-primary)' }}>
          {season.name}{prog.label ? ` · ${prog.label}` : ''}
        </div>
        <div style={{ display: 'flex', gap: 5, marginTop: 8 }}>
          {kpis.map((k) => (
            <div key={k.l} style={KPI} aria-label={`${k.l} (${k.scope}): ${(k.loading ?? loading) ? '—' : k.v}`}>
              <div style={{ fontSize: 15, fontWeight: 700, color: k.good ? 'var(--as-success)' : 'var(--as-text-primary)' }}>
                {(k.loading ?? loading) ? '—' : k.v}
              </div>
              <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--as-text-meta)', marginTop: 1 }}>
                {k.l}
              </div>
              <div aria-hidden="true" style={{ fontSize: 8, fontWeight: 500, letterSpacing: '0.03em', color: 'var(--as-text-meta)', marginTop: 1 }}>
                {k.scope}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

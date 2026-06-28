// L99 E2/E3/E4 — the dashboard's non-happy-path render states, factored out so
// the page stays additive + under the 150-line cap. All token-only colors,
// kindness microcopy (§16.3), Lucide icons, reuses the shared EmptyState +
// LoadingSkeleton primitives.
import { AlertTriangle, RefreshCw, Wallet } from 'lucide-react';
import EmptyState from '../shared/EmptyState';
import LoadingSkeleton from '../shared/LoadingSkeleton';

// E2 — money-load error banner. The page hook (useSeasonFinancials) surfaces an
// `error` that was previously swallowed; this makes the failure visible + offers
// a retry instead of silently showing $0 across the board (AP#36 spirit).
export function FinancialErrorBanner({ message, onRetry }) {
  return (
    <div role="alert" style={banner}>
      <AlertTriangle size={20} strokeWidth={1.75} color="var(--as-danger)" style={{ flexShrink: 0, marginTop: 1 }} aria-hidden="true" />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--as-text-primary)' }}>Couldn’t load the financials</div>
        <div style={{ fontSize: 13, color: 'var(--as-text-secondary)', marginTop: 2 }}>
          Couldn’t reach the server. Try again in a moment.
        </div>
        {message ? <div style={{ fontSize: 11, color: 'var(--as-text-tertiary)', marginTop: 4 }}>{message}</div> : null}
      </div>
      {onRetry && (
        <button type="button" onClick={onRetry} className="as-press" aria-label="Retry loading financials" style={retryBtn}>
          <RefreshCw size={16} strokeWidth={1.75} aria-hidden="true" /> Retry
        </button>
      )}
    </div>
  );
}

// E3 — no seasons with financial accounts yet (fresh org / pre-billing).
export function NoSeasonsState() {
  return (
    <EmptyState
      icon={Wallet}
      title="No billing yet"
      description="Once a season has families and fees, you’ll see what’s billed, collected, and outstanding right here."
    />
  );
}

// E4 — shape-matched skeleton for the summary card + progress bar + list while
// the season money loads. Replaces the bare “Loading…” text (§16.11).
export function FinancialDashboardSkeleton() {
  return (
    <div aria-busy="true" aria-live="polite">
      <span style={srOnly}>Loading financials…</span>
      <LoadingSkeleton variant="card" count={1} />
      <LoadingSkeleton variant="list" count={4} />
    </div>
  );
}

const banner = { display: 'flex', alignItems: 'flex-start', gap: 12, padding: 14, marginBottom: 16, backgroundColor: 'var(--as-danger-soft)', border: '1px solid var(--as-danger)', borderRadius: 10 };
const retryBtn = { display: 'flex', alignItems: 'center', gap: 6, minHeight: 44, padding: '0 12px', background: 'none', border: '1px solid var(--as-danger)', borderRadius: 8, color: 'var(--as-danger)', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', flexShrink: 0 };
const srOnly = { position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap', border: 0 };

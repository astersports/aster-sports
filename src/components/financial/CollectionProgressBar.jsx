// L99 E1 — collection-progress bar (Stripe-Dashboard financial-clarity
// benchmark). Single source/scope: reuses the SAME season `stats` object from
// useSeasonFinancials (family_balances view) the summary card reads — no second
// money source, no second scope (AP#63). It only re-renders the season pct/paid
// /billed already computed there as a visual fill, scope-LABELED "season".
import { formatCurrency } from '../../lib/formatters';

export default function CollectionProgressBar({ stats }) {
  const pct = Math.max(0, Math.min(100, stats?.pct ?? 0));
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={head}>
        <span style={lbl}>Collected this season<span style={tag}>season</span></span>
        <span style={pctTxt} aria-hidden="true">{pct}%</span>
      </div>
      <div
        style={track}
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Season collection: ${pct} percent collected, ${formatCurrency(stats?.paid)} of ${formatCurrency(stats?.billed)}`}
      >
        <div style={{ ...fill, width: `${pct}%` }} />
      </div>
      <div style={sub}>
        {formatCurrency(stats?.paid)} collected of {formatCurrency(stats?.billed)} billed
      </div>
    </div>
  );
}

const head = { display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 };
const lbl = { fontSize: 12, fontWeight: 600, color: 'var(--as-text-secondary)' };
const tag = { fontSize: 10, color: 'var(--as-text-tertiary)', marginLeft: 6 };
const pctTxt = { fontSize: 13, fontWeight: 700, color: 'var(--as-success)', fontVariantNumeric: 'tabular-nums' };
const track = { height: 8, borderRadius: 9999, backgroundColor: 'var(--as-bg-tertiary)', overflow: 'hidden' };
const fill = { height: '100%', borderRadius: 9999, backgroundColor: 'var(--as-success)', transition: 'width 300ms ease-out' };
const sub = { fontSize: 11, color: 'var(--as-text-tertiary)', marginTop: 6, fontVariantNumeric: 'tabular-nums' };

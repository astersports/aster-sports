// F-5 (render f5-financials-dashboard): the season money-at-a-glance card. Every
// metric is SCOPE-LABELED (season vs the named funnel program) so a season figure
// and an all-program one never read as a contradiction (Cat#30 PATTERN A / AP#63).
// billed/collected/outstanding/net all read the unified family_balances view;
// billed is gross-of-discount per the F-3 caveat. Funnel revenue is a separate
// line scoped to the open program ($0 until a registration lands).
export default function FinancialSummaryCard({ stats, seasonName, funnel, fmt }) {
  return (
    <div style={card}>
      <div style={scope}>{seasonName ? `${seasonName} · season` : 'Season'}</div>
      <div style={grid}>
        <div><div style={big}>{fmt(stats.billed)}</div><div style={lbl}>Billed</div></div>
        <div><div style={{ ...big, color: 'var(--as-success)' }}>{fmt(stats.paid)}</div><div style={lbl}>Collected · {stats.pct}%</div></div>
      </div>
      <div style={split} />
      <Line label="Outstanding" scopeTag="season" value={fmt(stats.outstanding)} valueColor="var(--as-danger)" />
      <Line label="Processing fees" scopeTag="season" value={`−${fmt(stats.fees)}`} />
      <Line label="Net to bank" scopeTag="season" value={fmt(stats.net)} strong />
      {funnel && <Line label="Funnel revenue" scopeTag={funnel.name} value={fmt(funnel.collectedCents)} />}
    </div>
  );
}

function Line({ label, scopeTag, value, valueColor, strong }) {
  return (
    <div style={line}>
      <span>{label}{scopeTag ? <span style={tag}>{scopeTag}</span> : null}</span>
      <b style={{ color: valueColor || 'var(--as-text-primary)', fontWeight: strong ? 700 : 600, fontVariantNumeric: 'tabular-nums' }}>{value}</b>
    </div>
  );
}

const card = { backgroundColor: 'var(--as-bg-card)', border: '1px solid var(--as-border-default)', borderTop: '3px solid var(--as-accent)', borderRadius: 10, padding: 16, marginBottom: 24, boxShadow: 'var(--as-shadow-sm)' };
const scope = { fontSize: 10, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--as-text-tertiary)', marginBottom: 10 };
const grid = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 };
const big = { fontSize: 22, fontWeight: 700, color: 'var(--as-text-primary)', fontVariantNumeric: 'tabular-nums' };
const lbl = { fontSize: 11, fontWeight: 500, color: 'var(--as-text-secondary)', marginTop: 2 };
const split = { height: 1, backgroundColor: 'var(--as-border-subtle)', margin: '13px 0' };
const line = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13, color: 'var(--as-text-secondary)', padding: '5px 0' };
const tag = { fontSize: 10, color: 'var(--as-text-tertiary)', marginLeft: 6 };

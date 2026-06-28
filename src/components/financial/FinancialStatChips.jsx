// L99 E9/E10 — at-a-glance KPI chip row (Stripe-Dashboard density benchmark).
// Every figure is DERIVED from the SAME season `stats` object + the accounts
// count the page already has — no new query, no second money source/scope
// (AP#63). All three chips are season-scoped (matching the summary card), so the
// row carries one scope tag rather than repeating it per chip.
//   • Families       — total accounts for the season
//   • Avg / family   — billed ÷ families (gross-of-discount, same basis as the card)
//   • Avg owed       — outstanding ÷ families owing (the E10 figure)
import { formatCurrency } from '../../lib/formatters';

export default function FinancialStatChips({ stats, familyCount }) {
  const owing = stats?.familiesOwing ?? 0;
  const billed = stats?.billed ?? 0;
  const outstanding = stats?.outstanding ?? 0;
  const avgBilled = familyCount > 0 ? Math.round(billed / familyCount) : 0;
  const avgOwed = owing > 0 ? Math.round(outstanding / owing) : 0;

  const chips = [
    { label: 'Families', value: String(familyCount ?? 0) },
    { label: 'Avg billed / family', value: formatCurrency(avgBilled) },
    { label: 'Avg owed / owing family', value: owing > 0 ? formatCurrency(avgOwed) : '—' },
  ];

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={scope}>Season averages<span style={tag}>season</span></div>
      <div style={row}>
        {chips.map((c) => (
          <div key={c.label} style={chip}>
            <div style={val}>{c.value}</div>
            <div style={lbl}>{c.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

const scope = { fontSize: 10, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--as-text-tertiary)', marginBottom: 8 };
const tag = { fontSize: 10, fontWeight: 500, letterSpacing: 0, textTransform: 'none', color: 'var(--as-text-tertiary)', marginLeft: 6 };
const row = { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 };
const chip = { backgroundColor: 'var(--as-bg-card)', border: '1px solid var(--as-border-default)', borderRadius: 10, padding: '10px 12px', boxShadow: 'var(--as-shadow-sm)' };
const val = { fontSize: 17, fontWeight: 700, color: 'var(--as-text-primary)', fontVariantNumeric: 'tabular-nums' };
const lbl = { fontSize: 11, fontWeight: 500, color: 'var(--as-text-secondary)', marginTop: 2, lineHeight: 1.3 };

import { formatCurrency } from '../../lib/formatters';

// At-a-glance family summary (L99 enhancement). One scoped source per metric:
// enrollments from children, total due from family_balances (parent-own, sum of
// positive balances only — a credit never reads as "owed"), open count from
// openPrograms. Scope label ("your family") keeps it from reading as an org
// rollup (AP#63). --as-* tokens only.
export default function FamilySummaryStrip({ children, balances, openCount }) {
  const enrolledCount = children.reduce((n, c) => n + c.enrollments.length, 0);
  const dueCents = balances.reduce((sum, r) => sum + Math.max(r.balance?.balance_cents ?? 0, 0), 0);
  const dueTone = dueCents > 0 ? 'var(--as-danger)' : 'var(--as-success)';

  const cells = [
    { key: 'enrolled', value: String(enrolledCount), label: enrolledCount === 1 ? 'Enrollment' : 'Enrollments', tone: 'var(--as-text-primary)' },
    { key: 'due', value: dueCents > 0 ? formatCurrency(dueCents) : 'Paid up', label: 'Balance due', tone: dueTone },
    { key: 'open', value: String(openCount), label: openCount === 1 ? 'Open program' : 'Open programs', tone: openCount > 0 ? 'var(--as-accent)' : 'var(--as-text-primary)' },
  ];

  return (
    <section style={strip} aria-label="Family summary · your family">
      {cells.map((c) => (
        <div key={c.key} style={cell}>
          <div style={{ ...val, color: c.tone }}>{c.value}</div>
          <div style={lbl}>{c.label}</div>
        </div>
      ))}
    </section>
  );
}

const strip = { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, backgroundColor: 'var(--as-border-subtle)', border: '1px solid var(--as-border-default)', borderRadius: 13, overflow: 'hidden', marginBottom: 12 };
const cell = { backgroundColor: 'var(--as-bg-card)', padding: '12px 8px', textAlign: 'center', minWidth: 0 };
const val = { fontSize: 17, fontWeight: 700, fontVariantNumeric: 'tabular-nums', lineHeight: 1.15, overflow: 'hidden', textOverflow: 'ellipsis' };
const lbl = { fontSize: 10.5, fontWeight: 600, letterSpacing: '0.03em', textTransform: 'uppercase', color: 'var(--as-text-meta)', marginTop: 4 };

import { Check, Info } from 'lucide-react';
import { formatCurrency } from '../../lib/formatters';

// Family balance for one program on My Family (PR-B1). ONE source: family_balances
// (parent-own). A co-guardian whose account is held by the other parent gets the
// "managed by" treatment (a leak-free gap, architect-ruled) — never a number.
export default function FamilyBalanceCard({ row }) {
  const due = row.balance?.balance_cents ?? 0;
  const tone = due > 0 ? 'var(--as-danger)' : due < 0 ? 'var(--as-text-secondary)' : 'var(--as-success)';
  const label = due > 0 ? `${formatCurrency(due)} due` : due < 0 ? `${formatCurrency(-due)} credit` : 'Paid in full';

  return (
    <section style={card} aria-label={`${row.programName} balance`}>
      <div style={head}>
        <span style={lbl}>{row.programName} balance</span>
        <span style={scope}>your family</span>
      </div>
      {row.managed ? (
        <div style={managed}>
          <Info size={17} strokeWidth={2} style={{ flex: 'none', marginTop: 1, color: 'var(--as-text-meta)' }} aria-hidden="true" />
          <div style={{ fontSize: 12.5, color: 'var(--as-text-secondary)' }}>
            <b style={{ color: 'var(--as-text-primary)', fontWeight: 600 }}>Managed by the registering parent.</b>{' '}
            Contact the program admin for balance details.
          </div>
        </div>
      ) : (
        <>
          <div style={{ ...big, color: tone }}>
            {due === 0 && <Check size={18} strokeWidth={2.6} aria-hidden="true" />}
            {label}
          </div>
          <div style={sub}>
            {formatCurrency(row.balance?.billed_cents ?? 0)} billed · {formatCurrency(row.balance?.net_paid_cents ?? 0)} paid · {formatCurrency(Math.max(due, 0))} due
          </div>
        </>
      )}
    </section>
  );
}

const card = { backgroundColor: 'var(--as-bg-card)', border: '1px solid var(--as-border-default)', borderRadius: 13, padding: 15, marginBottom: 12 };
const head = { display: 'flex', alignItems: 'center', justifyContent: 'space-between' };
const lbl = { fontSize: 12, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--as-text-secondary)' };
const scope = { fontSize: 11, fontWeight: 600, color: 'var(--as-text-meta)' };
const big = { marginTop: 10, display: 'flex', alignItems: 'center', gap: 8, fontSize: 18, fontWeight: 700, fontVariantNumeric: 'tabular-nums' };
const sub = { fontSize: 12.5, color: 'var(--as-text-secondary)', marginTop: 6 };
const managed = { marginTop: 10, display: 'flex', gap: 9, alignItems: 'flex-start', backgroundColor: 'var(--as-bg-secondary)', borderRadius: 9, padding: '11px 12px' };

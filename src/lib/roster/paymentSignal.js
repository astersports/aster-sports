import { formatCurrency } from '../formatters';

// PR-1 (Teams redesign): the ADMIN roster payment signal, derived ONLY from
// family_balances (never roster_members.amount_paid/amount_due — the A.6 trap).
// Pure: balance_cents in, { dot, label, labelColor } out. balance>0 = owes,
// <0 = credit (good news), 0 = paid. `pastDue` (a due date is known AND elapsed)
// turns an owed balance red/Overdue — wired in PR-3 when the deposit due-date
// lands; PR-1 always passes false (clean-slate season has no balances yet).
//
// SCOPE NOTE (flagged for PR-3): useRoster sums family_balances across ALL
// seasons (the deliberate Cat#30 ROSTER-1 dot semantics — "does this family owe
// anywhere"). The render asked for a "this season" label; that scope
// reconciliation is deferred to PR-3, so this helper emits only the amount, no
// scope word. On the clean-slate Summer season every balance is 0 today.
export function paymentSignal(balanceCents, pastDue = false) {
  const bal = Number(balanceCents) || 0;
  if (bal < 0) {
    return { dot: 'var(--as-success)', label: `Credit ${formatCurrency(-bal)}`, labelColor: 'var(--as-success)' };
  }
  if (bal > 0) {
    return pastDue
      ? { dot: 'var(--as-danger)', label: `Overdue · ${formatCurrency(bal)}`, labelColor: 'var(--as-danger)' }
      : { dot: 'var(--as-warning)', label: `Owes ${formatCurrency(bal)}`, labelColor: 'var(--as-text-secondary)' };
  }
  return { dot: 'var(--as-success)', label: 'Paid', labelColor: 'var(--as-text-secondary)' };
}

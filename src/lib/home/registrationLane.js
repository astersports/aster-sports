// H-1 — pure face selector for the admin Home Registration rollup card. Maps the
// open-program state to one of four faces (no IO; testable in isolation):
//   single_fee   — 1 open, fee set        → program name + stats
//   single_nofee — 1 open, no fee          → the "Set the fee" nudge
//   multi        — 2+ open, all fee-set     → "Registration · N open" + aggregate
//   multi_mixed  — 2+ open, some need a fee → aggregate + a "needs a fee" nudge
export function laneFace({ openCount, needsFeeCount, singleProgram }) {
  if (openCount === 1) return singleProgram?.feeSet ? 'single_fee' : 'single_nofee';
  return needsFeeCount > 0 ? 'multi_mixed' : 'multi';
}

// H-2 — the parent's total amount owed across the family, from the ONE shared
// source (family_balances, parent-own). Only positive balances count (a credit
// isn't "due"); "managed by the other parent" rows carry no number and are skipped.
export function familyDueCents(familyBalances = []) {
  return familyBalances.reduce((s, b) => s + (b.managed ? 0 : Math.max(b.balance?.balance_cents || 0, 0)), 0);
}

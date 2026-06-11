// F-4 "record money out" — pure helpers for the 3-mode record form (Payment /
// Refund / Adjustment). Each mode writes ONE financial_transaction the
// family_balances view already buckets:
//   payment    +amount -> net_paid up  -> balance DOWN
//   refund     +amount -> net_paid down-> balance UP   (increases what's owed)
//   adjustment ±amount -> net_paid ±    -> credit (down) or charge (up)
// (view nets adjustment as +amount_cents, so a CHARGE stores a NEGATIVE amount.)
export const MONEY_MODES = ['payment', 'refund', 'adjustment'];

// The balance a family would have AFTER recording this transaction.
export function balanceAfter(mode, balanceCents, amountCents, adjustCharge) {
  const a = amountCents || 0;
  if (mode === 'payment') return balanceCents - a;
  if (mode === 'refund') return balanceCents + a;
  return adjustCharge ? balanceCents + a : balanceCents - a; // adjustment
}

// The transaction_type + signed amount_cents to insert. Adjustment "charge" stores a
// negative amount (the view adds it to net_paid); payment/refund stay positive
// (DB CHECKs require it). amountCents in is always the positive magnitude entered.
export function txnForMode(mode, amountCents, adjustCharge) {
  if (mode === 'adjustment') {
    return { transaction_type: 'adjustment', amount_cents: adjustCharge ? -amountCents : amountCents };
  }
  return { transaction_type: mode, amount_cents: amountCents };
}

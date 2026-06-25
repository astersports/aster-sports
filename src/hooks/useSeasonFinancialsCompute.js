// Pure aggregation for useSeasonFinancials, extracted to keep the hook
// under the 150-line cap (CLAUDE.md §6). Sourced entirely from the
// family_balances view rows (one money read path per #63).

export const EMPTY_STATS = { billed: 0, paid: 0, fees: 0, net: 0, outstanding: 0, familiesOwing: 0, pct: 0 };

// balanceRows -> { balances (account_id->balance), byAccount, stats }.
export function computeSeasonStats(balanceRows) {
  let billed = 0; let paid = 0; let fees = 0; let outstanding = 0; let familiesOwing = 0;
  const bal = {};
  const by = {};
  balanceRows.forEach((r) => {
    const billedC = Number(r.billed_cents) || 0;
    const netPaidC = Number(r.net_paid_cents) || 0;
    const b = Number(r.balance_cents) || 0;
    bal[r.account_id] = b;
    // byAccount exposes the view's per-account money so display surfaces
    // (FamilyBalanceList, F-2) read billed/net_paid from the view instead
    // of the raw season_fee/discount columns STEP 2 will zero.
    by[r.account_id] = { billed: billedC, netPaid: netPaidC, balance: b };
    billed += billedC;
    paid += netPaidC;
    fees += Number(r.total_fees_cents) || 0;
    outstanding += b;
    if (b > 0) familiesOwing += 1;
  });
  return {
    balances: bal,
    byAccount: by,
    stats: {
      billed, paid, fees,
      net: paid - fees,
      outstanding,
      familiesOwing,
      pct: billed > 0 ? Math.round((paid / billed) * 100) : 0,
    },
  };
}

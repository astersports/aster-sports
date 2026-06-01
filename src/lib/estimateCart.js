// Pure cart estimator for the registration wizard (anti-pattern #27 — no IO, no client
// import; same input → deeply-equal output). This is the CLIENT-SIDE PREVIEW only; the
// submit_registration RPC computes the authoritative persisted total server-side
// (PATTERN A #63). Family-cap is a no-op for LH (null policy) and lights up when a policy
// with {enabled, per_extra_child_cents} is present (St Pat's, 2027).
//
// children: [{ player?, division: { name, base_fee_cents, fees:[{fee_type, amount_cents}] } }]
// policy:   organizations.family_cap_policy | null

export function divisionFeeCents(division) {
  if (!division) return 0;
  const fees = Array.isArray(division.fees) ? division.fees : [];
  const billable = fees.filter((f) => f.fee_type === 'base' || f.fee_type === 'add_on');
  if (billable.length) return billable.reduce((sum, f) => sum + (f.amount_cents || 0), 0);
  return division.base_fee_cents || 0;
}

export function estimateCart(children, policy) {
  const lineItems = (children || []).map((c) => ({
    name: c?.player?.first_name || 'Player',
    divisionName: c?.division?.name || '',
    amountCents: divisionFeeCents(c?.division),
  }));
  const subtotalCents = lineItems.reduce((sum, li) => sum + li.amountCents, 0);
  const paid = lineItems.length;
  let discountCents = 0;
  if (policy && policy.enabled && paid > 1) {
    discountCents = Math.min((paid - 1) * (policy.per_extra_child_cents || 0), subtotalCents);
  }
  return { lineItems, subtotalCents, discountCents, totalCents: subtotalCents - discountCents };
}

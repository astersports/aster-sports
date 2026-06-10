import { describe, expect, it } from 'vitest';
import { divisionFeeCents, estimateCart } from '../estimateCart';

const div = (cents, fees) => ({ name: 'D', base_fee_cents: cents, fees });

describe('estimateCart (pure — anti-pattern #27)', () => {
  it('sums base + add_on fees per child', () => {
    const d = div(0, [{ fee_type: 'base', amount_cents: 80000 }, { fee_type: 'add_on', amount_cents: 5000 }]);
    const r = estimateCart([{ player: { first_name: 'A' }, division: d }], null);
    expect(r.subtotalCents).toBe(85000);
    expect(r.totalCents).toBe(85000);
    expect(r.discountCents).toBe(0);
    expect(r.lineItems).toHaveLength(1);
  });

  it('falls back to base_fee_cents when no fees array', () => {
    expect(divisionFeeCents(div(70000, null))).toBe(70000);
  });

  it('ignores non-billable fee types (discount/family_discount)', () => {
    const d = div(0, [{ fee_type: 'base', amount_cents: 80000 }, { fee_type: 'family_discount', amount_cents: -20000 }]);
    expect(divisionFeeCents(d)).toBe(80000);
  });

  it('no discount when policy is null (LH pilot)', () => {
    const d = div(0, [{ fee_type: 'base', amount_cents: 80000 }]);
    const r = estimateCart([{ division: d }, { division: d }], null);
    expect(r.discountCents).toBe(0);
    expect(r.totalCents).toBe(160000);
  });

  it('applies per-extra-child discount when policy enabled', () => {
    const d = div(0, [{ fee_type: 'base', amount_cents: 80000 }]);
    const r = estimateCart([{ division: d }, { division: d }, { division: d }], { enabled: true, per_extra_child_cents: 20000 });
    expect(r.discountCents).toBe(40000); // 2 extra children × 20000
    expect(r.totalCents).toBe(200000);
  });

  it('caps discount at subtotal (never negative total)', () => {
    const d = div(0, [{ fee_type: 'base', amount_cents: 1000 }]);
    const r = estimateCart([{ division: d }, { division: d }], { enabled: true, per_extra_child_cents: 999999 });
    expect(r.totalCents).toBe(0);
  });

  it('deterministic: same input → deeply-equal output', () => {
    const d = div(0, [{ fee_type: 'base', amount_cents: 80000 }]);
    expect(estimateCart([{ division: d }], null)).toEqual(estimateCart([{ division: d }], null));
  });

  it('empty children → zeroed cart', () => {
    expect(estimateCart([], null)).toEqual({ lineItems: [], subtotalCents: 0, discountCents: 0, totalCents: 0 });
  });
});

// D4 / AP#43 — estimate ⇄ authoritative parity. Locks that the client estimate
// uses the SAME family-cap formula as the server RPC (submit_registration):
//   v_discount := LEAST((v_paid - 1) * per_extra_child_cents, v_total)
//   authoritative_total := v_total - v_discount
// If either side drifts, the multi-child review preview and the confirmation's
// result.authoritative_total_cents diverge (#63) — exactly the failure R1's
// multi-child math could introduce.
describe('estimateCart ⇄ submit_registration parity (D4 / AP#43)', () => {
  const rpcTotal = (feeCentsList, policy) => {
    const subtotal = feeCentsList.reduce((a, b) => a + b, 0);
    const paid = feeCentsList.length;
    let discount = 0;
    if (policy?.enabled && paid > 1) discount = Math.min((paid - 1) * (policy.per_extra_child_cents || 0), subtotal);
    return { discount, total: subtotal - discount };
  };
  const cases = [
    { fees: [8000, 2000], policy: { enabled: true, per_extra_child_cents: 1000 } },
    { fees: [80000, 80000, 80000], policy: { enabled: true, per_extra_child_cents: 20000 } },
    { fees: [4500, 4500], policy: null },                                                // LH pilot — no policy
    { fees: [1000, 1000], policy: { enabled: true, per_extra_child_cents: 999999 } },    // discount capped at subtotal
  ];
  it.each(cases)('matches the RPC family-cap formula for $fees', ({ fees, policy }) => {
    const est = estimateCart(fees.map((c) => ({ division: { base_fee_cents: c } })), policy);
    const rpc = rpcTotal(fees, policy);
    expect(est.discountCents).toBe(rpc.discount);
    expect(est.totalCents).toBe(rpc.total);
  });
});

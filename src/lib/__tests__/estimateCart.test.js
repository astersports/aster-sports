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

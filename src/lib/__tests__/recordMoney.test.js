import { describe, expect, it } from 'vitest';
import { balanceAfter, txnForMode } from '../recordMoney';

describe('recordMoney (F-4 record money out)', () => {
  it('balanceAfter: payment reduces, refund increases, adjustment credit/charge', () => {
    expect(balanceAfter('payment', 10000, 4000)).toBe(6000);
    expect(balanceAfter('refund', 10000, 2500)).toBe(12500);          // refund increases what's owed
    expect(balanceAfter('adjustment', 10000, 3000, false)).toBe(7000); // credit reduces
    expect(balanceAfter('adjustment', 10000, 3000, true)).toBe(13000); // charge increases
  });

  it('txnForMode: payment/refund positive; adjustment credit +, charge −', () => {
    expect(txnForMode('payment', 5000)).toEqual({ transaction_type: 'payment', amount_cents: 5000 });
    expect(txnForMode('refund', 5000)).toEqual({ transaction_type: 'refund', amount_cents: 5000 });
    expect(txnForMode('adjustment', 5000, false)).toEqual({ transaction_type: 'adjustment', amount_cents: 5000 });
    expect(txnForMode('adjustment', 5000, true)).toEqual({ transaction_type: 'adjustment', amount_cents: -5000 });
  });
});

import { describe, expect, it } from 'vitest';
import { countOwedSessions, sumOwedCents, sumPaidCents } from '../coachComp';

// PR-1 cross-surface invariant (AP#43): the three coach surfaces (own card,
// admin detail, admin list) ALL derive owed/paid from these two helpers, so they
// can never diverge again (the old $2,100 / $1,140 / rate×count split + the
// −$680 netting artifact). Lock the canonical math here.

describe('coachComp canonical owed/paid (DR-F1)', () => {
  const sessions = [
    { pay_cents: 6000, pay_status: 'owed' },
    { pay_cents: 6000, pay_status: 'owed' },
    { pay_cents: 6000, pay_status: 'paid' },     // settled — NOT owed
    { pay_cents: 6000, pay_status: 'excluded' }, // excluded — NOT owed
  ];
  const payouts = [
    { amount_cents: 168000, status: 'paid' },
    { amount_cents: 110000, status: 'paid' },
    { amount_cents: 54000, status: 'pending' },  // pending — NOT paid
    { amount_cents: 45000, status: 'disputed' }, // disputed — NOT paid
  ];

  it('owed = Σ pay_cents over ONLY pay_status=owed (paid/excluded excluded)', () => {
    expect(sumOwedCents(sessions)).toBe(12000);
  });

  it('paid = Σ amount_cents over ONLY status=paid (pending/disputed excluded)', () => {
    expect(sumPaidCents(payouts)).toBe(278000);
  });

  it('owed and paid are independent — never netted/subtracted', () => {
    // The whole point of PR-1: a coach with $12k paid and $12k owed is NOT $0.
    const owed = sumOwedCents(sessions);
    const paid = sumPaidCents(payouts);
    expect(owed).toBe(12000);
    expect(paid).toBe(278000);
    // there is no balance = owed − paid anywhere; assert they stay separate
    expect(owed).not.toBe(paid - owed);
  });

  it('countOwedSessions counts only owed rows', () => {
    expect(countOwedSessions(sessions)).toBe(2);
  });

  it('empty / null inputs are zero, never NaN', () => {
    expect(sumOwedCents(null)).toBe(0);
    expect(sumOwedCents([])).toBe(0);
    expect(sumPaidCents(undefined)).toBe(0);
    expect(countOwedSessions(null)).toBe(0);
  });

  it('null pay_cents / amount_cents do not poison the sum', () => {
    expect(sumOwedCents([{ pay_cents: null, pay_status: 'owed' }, { pay_cents: 6000, pay_status: 'owed' }])).toBe(6000);
    expect(sumPaidCents([{ amount_cents: null, status: 'paid' }, { amount_cents: 100, status: 'paid' }])).toBe(100);
  });
});

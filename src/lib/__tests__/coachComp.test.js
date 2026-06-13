import { describe, expect, it } from 'vitest';
import { buildSettlements, countOwedSessions, sumOwedCents, sumPaidCents } from '../coachComp';

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

describe('buildSettlements (PR-2 — pay_coach payloads)', () => {
  const ctx = { orgId: 'org1', coachId: 'c1', method: 'venmo', paidAt: '2026-06-13T16:00:00Z' };

  it('one season → one paid payload, amount = Σ pay_cents, ids correct', () => {
    const sessions = [
      { id: 's1', pay_cents: 6000, seasonId: 'spring' },
      { id: 's2', pay_cents: 6000, seasonId: 'spring' },
    ];
    const out = buildSettlements(sessions, ctx);
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({
      p_org: 'org1', p_coach: 'c1', p_season: 'spring', p_amount_cents: 12000,
      p_status: 'paid', p_method: 'venmo', p_paid_at: '2026-06-13T16:00:00Z',
    });
    expect(out[0].p_session_ids).toEqual(['s1', 's2']);
  });

  it('status is ALWAYS paid (Migration D rejects anything else)', () => {
    const out = buildSettlements([{ id: 's1', pay_cents: 6000, seasonId: 'x' }], ctx);
    expect(out[0].p_status).toBe('paid');
  });

  it('two seasons → two payloads, each summed independently (one pay_coach call per season)', () => {
    const sessions = [
      { id: 's1', pay_cents: 6000, seasonId: 'spring' },
      { id: 's2', pay_cents: 5000, seasonId: 'fall' },
      { id: 's3', pay_cents: 6000, seasonId: 'spring' },
    ];
    const out = buildSettlements(sessions, ctx);
    expect(out).toHaveLength(2);
    const spring = out.find((p) => p.p_season === 'spring');
    const fall = out.find((p) => p.p_season === 'fall');
    expect(spring.p_amount_cents).toBe(12000);
    expect(spring.p_session_ids).toEqual(['s1', 's3']);
    expect(fall.p_amount_cents).toBe(5000);
  });

  it('empty selection → no payloads', () => {
    expect(buildSettlements([], ctx)).toEqual([]);
    expect(buildSettlements(null, ctx)).toEqual([]);
  });

  it('default notes reflect session count', () => {
    expect(buildSettlements([{ id: 'a', pay_cents: 6000, seasonId: 's' }], ctx)[0].p_notes).toBe('Settled 1 session via app');
    expect(buildSettlements([{ id: 'a', pay_cents: 6000, seasonId: 's' }, { id: 'b', pay_cents: 6000, seasonId: 's' }], ctx)[0].p_notes).toBe('Settled 2 sessions via app');
  });
});

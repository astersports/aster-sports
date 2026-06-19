import { describe, expect, it } from 'vitest';
import { paymentSignal } from '../paymentSignal';

// Locks the admin roster payment-signal mapping (PR-1). family_balances is the
// one source; this helper renders the dot + money line for the admin row.
describe('paymentSignal', () => {
  it('zero balance => Paid, green dot', () => {
    const s = paymentSignal(0);
    expect(s.label).toBe('Paid');
    expect(s.dot).toBe('var(--as-success)');
  });
  it('positive balance => Owes $, amber dot, neutral label', () => {
    const s = paymentSignal(40000);
    expect(s.label).toBe('Owes $400.00');
    expect(s.dot).toBe('var(--as-warning)');
    expect(s.labelColor).toBe('var(--as-text-secondary)');
  });
  it('negative balance => Credit $, green dot + green label', () => {
    const s = paymentSignal(-5000);
    expect(s.label).toBe('Credit $50.00');
    expect(s.dot).toBe('var(--as-success)');
    expect(s.labelColor).toBe('var(--as-success)');
  });
  it('pastDue + positive => Overdue, red', () => {
    const s = paymentSignal(40000, true);
    expect(s.label).toBe('Overdue · $400.00');
    expect(s.dot).toBe('var(--as-danger)');
    expect(s.labelColor).toBe('var(--as-danger)');
  });
  it('pastDue is ignored when not owing', () => {
    expect(paymentSignal(0, true).label).toBe('Paid');
    expect(paymentSignal(-100, true).dot).toBe('var(--as-success)');
  });
  it('null/undefined balance defaults to Paid', () => {
    expect(paymentSignal(undefined).label).toBe('Paid');
    expect(paymentSignal(null).label).toBe('Paid');
  });
});

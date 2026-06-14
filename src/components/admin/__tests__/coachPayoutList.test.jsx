// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import CoachPayoutList from '../CoachPayoutList';
import { formatCurrency } from '../../../lib/formatters';

afterEach(cleanup);

// PR-3 prior-payouts split: settled (source_assignments populated) vs prior
// (source_assignments NULL, pre-tracking). Locks the discriminator + subtotals.
const payouts = [
  { id: 's1', amount_cents: 168000, status: 'paid', payment_method: 'check', paid_at: '2026-05-01', created_at: '2026-05-01', source_assignments: new Array(28).fill('x') },
  { id: 's2', amount_cents: 12000, status: 'paid', payment_method: 'zelle', paid_at: '2026-06-13', created_at: '2026-06-13', source_assignments: ['a', 'b'] },
  { id: 'p1', amount_cents: 80000, status: 'paid', payment_method: 'venmo', paid_at: '2026-02-20', created_at: '2026-02-20', source_assignments: null },
  { id: 'p2', amount_cents: 30000, status: 'paid', payment_method: 'cash', paid_at: '2026-04-25', created_at: '2026-04-25', source_assignments: null },
];

describe('CoachPayoutList (PR-3 split)', () => {
  it('splits settled vs prior with paid subtotals', () => {
    const { getByText } = render(<CoachPayoutList payouts={payouts} onEdit={() => {}} />);
    expect(getByText(`Settled · ${formatCurrency(180000)}`)).toBeTruthy();       // 168000 + 12000
    expect(getByText(`Prior payouts · ${formatCurrency(110000)}`)).toBeTruthy(); // 80000 + 30000
    expect(getByText('before settlement tracking')).toBeTruthy();
  });

  it('shows the session count on settled rows only', () => {
    const { getByText, queryAllByText } = render(<CoachPayoutList payouts={payouts} onEdit={() => {}} />);
    expect(getByText(/28 sessions/)).toBeTruthy();
    expect(getByText(/2 sessions/)).toBeTruthy();
    // prior rows carry no "session" caption
    expect(queryAllByText(/session/).length).toBe(2);
  });

  it('a coach with only prior payouts shows no Settled group', () => {
    const { queryByText, getByText } = render(<CoachPayoutList payouts={payouts.filter((p) => !p.source_assignments)} onEdit={() => {}} />);
    expect(queryByText(/^Settled ·/)).toBeNull();
    expect(getByText(/^Prior payouts ·/)).toBeTruthy();
  });

  it('empty → "No payouts recorded."', () => {
    const { getByText } = render(<CoachPayoutList payouts={[]} onEdit={() => {}} />);
    expect(getByText('No payouts recorded.')).toBeTruthy();
  });
});

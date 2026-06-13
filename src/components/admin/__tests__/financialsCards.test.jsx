// @vitest-environment jsdom
//
// AP#46 invariant coverage for the Financials redesign cards (2026-06-13):
// CoachPayoutCard (per-coach payout grouping) + FamilyBalanceRow (family
// balance line). Locks the money-rendering + expand/owing behavior so a
// future style change can't silently break them.

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import CoachPayoutCard from '../CoachPayoutCard';
import FamilyBalanceRow from '../FamilyBalanceRow';
import { formatCurrency } from '../../../lib/formatters';

afterEach(cleanup);

const coach = {
  userId: 'u1', name: 'Coach Kenny', paidCents: 72000, pendingCents: 54000,
  rows: [{ id: 'p1', amount_cents: 72000, status: 'paid', payment_method: 'venmo', paid_at: '2026-04-10', created_at: '2026-04-10' }],
};

describe('CoachPayoutCard', () => {
  it('shows the coach name + season total, rows hidden until expanded', () => {
    const { getByText, queryByText, getAllByRole } = render(<CoachPayoutCard coach={coach} />);
    expect(getByText('Coach Kenny')).toBeTruthy();
    expect(getByText(formatCurrency(126000))).toBeTruthy(); // 72000 paid + 54000 pending
    expect(queryByText('Venmo')).toBeNull(); // collapsed: row detail not rendered
    fireEvent.click(getAllByRole('button')[0]);
    expect(queryByText('Venmo')).not.toBeNull(); // expanded: row method shows
  });
});

describe('FamilyBalanceRow', () => {
  const base = { id: 'f1', name: 'Smith', billed: 70000, netPaid: 65000 };

  it('owing family shows the balance + record affordance + Message', () => {
    const onNudge = vi.fn();
    const { getByText } = render(<FamilyBalanceRow family={{ ...base, balance: 5000 }} fmt={formatCurrency} onRecordPayment={() => {}} onNudge={onNudge} topBorder={false} />);
    expect(getByText(formatCurrency(5000))).toBeTruthy();
    expect(getByText('Tap to record')).toBeTruthy();
    expect(getByText('Message')).toBeTruthy();
  });

  it('paid family shows "Paid" and no Message button', () => {
    const { getByText, queryByText } = render(<FamilyBalanceRow family={{ ...base, balance: 0 }} fmt={formatCurrency} onRecordPayment={() => {}} onNudge={vi.fn()} topBorder />);
    expect(getByText('Paid')).toBeTruthy();
    expect(queryByText('Message')).toBeNull();
  });
});

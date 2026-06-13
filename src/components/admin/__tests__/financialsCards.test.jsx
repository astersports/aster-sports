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
import TeamBalanceCard from '../TeamBalanceCard';
import { formatCurrency } from '../../../lib/formatters';

afterEach(cleanup);

const coach = {
  userId: 'u1', name: 'Coach Kenny', paidCents: 72000, pendingCents: 54000, owedCents: 0, rateCents: 0, balanceCents: -72000,
  rows: [{ id: 'p1', amount_cents: 72000, status: 'paid', payment_method: 'venmo', paid_at: '2026-04-10', created_at: '2026-04-10' }],
};

const ratedCoach = {
  userId: 'u2', name: 'Coach Darien', paidCents: 198000, pendingCents: 0, owedCents: 210000, rateCents: 6000, balanceCents: 12000,
  rows: [{ id: 'p2', amount_cents: 198000, status: 'paid', payment_method: 'cash', paid_at: '2026-05-01', created_at: '2026-05-01' }],
};

describe('CoachPayoutCard', () => {
  it('unrated coach shows recorded total, rows hidden until expanded', () => {
    const { getByText, queryByText, getAllByRole } = render(<CoachPayoutCard coach={coach} />);
    expect(getByText('Coach Kenny')).toBeTruthy();
    expect(getByText(formatCurrency(126000))).toBeTruthy(); // 72000 paid + 54000 pending
    expect(queryByText('Venmo')).toBeNull(); // collapsed: row detail not rendered
    fireEvent.click(getAllByRole('button')[0]);
    expect(queryByText('Venmo')).not.toBeNull(); // expanded: row method shows
  });

  it('rated coach shows balance (owed − paid), rate, and an owed breakdown on expand', () => {
    const { getByText, queryByText, getAllByRole } = render(<CoachPayoutCard coach={ratedCoach} />);
    expect(getByText(formatCurrency(12000))).toBeTruthy(); // |balance| = $120
    expect(getByText('still owed · ' + formatCurrency(198000) + ' paid')).toBeTruthy();
    expect(getByText(formatCurrency(6000) + '/session')).toBeTruthy();
    expect(queryByText('Owed ' + formatCurrency(210000))).toBeNull(); // collapsed
    fireEvent.click(getAllByRole('button')[0]);
    expect(getByText('Owed ' + formatCurrency(210000))).toBeTruthy(); // expanded breakdown
  });
});

describe('TeamBalanceCard', () => {
  const team = { id: 't1', name: '11U Girls', team_color: '#123456' };
  const fams = [
    { id: 'a', name: 'Smith', balance: 5000, billed: 70000, netPaid: 65000 },
    { id: 'b', name: 'Jones', balance: 0, billed: 70000, netPaid: 70000 },
  ];

  it('header shows family/player counts + outstanding; breakdown on expand', () => {
    const { getByText, queryByText, getAllByRole } = render(
      <TeamBalanceCard team={team} families={fams} playerCount={3} fmt={formatCurrency} onRecordPayment={() => {}} onNudge={() => {}} />
    );
    expect(getByText('11U Girls')).toBeTruthy();
    expect(getByText('2 families · 3 players')).toBeTruthy();
    expect(getByText(formatCurrency(5000))).toBeTruthy(); // outstanding headline
    expect(queryByText('Billed ' + formatCurrency(140000))).toBeNull(); // collapsed
    fireEvent.click(getAllByRole('button')[0]);
    expect(getByText('Billed ' + formatCurrency(140000))).toBeTruthy(); // 70000 + 70000
    expect(getByText('Collected ' + formatCurrency(135000))).toBeTruthy(); // 65000 + 70000
  });

  it('all-paid team shows "All paid"', () => {
    const paidFams = [{ id: 'c', name: 'Lee', balance: 0, billed: 70000, netPaid: 70000 }];
    const { getByText } = render(<TeamBalanceCard team={team} families={paidFams} playerCount={1} fmt={formatCurrency} onRecordPayment={() => {}} onNudge={() => {}} />);
    expect(getByText('All paid')).toBeTruthy();
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

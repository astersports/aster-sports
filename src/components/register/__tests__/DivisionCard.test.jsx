// @vitest-environment jsdom
//
// Invariant test for DivisionCard per CLAUDE.md anti-pattern #46 (+ #43 cross-surface).
// DivisionCard renders on the public registration entry across three program reg-window
// states (open / upcoming / closed). Locks: the fee always renders via formatCurrency
// (cents → "$X.XX" — the cross-surface money-display invariant), the grade-band label,
// the pill label per state, and the interactivity contract (tappable only when the
// program is open AND an onSelect is provided — Q-2: program-level window state, no
// per-division capacity/waitlist in v1).

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import DivisionCard from '../DivisionCard';

afterEach(cleanup);

const DIV = { id: 'd1', name: '11U Girls', grade_min: 5, grade_max: 6, team_color: '#a78bfa', base_fee_cents: 80000 };

describe('DivisionCard invariants (anti-pattern #46/#43)', () => {
  it('renders name, grade band, and fee from cents via formatCurrency', () => {
    const { getByText } = render(<DivisionCard division={DIV} regState="open" onSelect={() => {}} />);
    expect(getByText('11U Girls')).toBeTruthy();
    expect(getByText(/Grades 5–6/)).toBeTruthy();
    expect(getByText(/\$800\.00/)).toBeTruthy();
  });

  it('open + onSelect → OPEN pill, interactive, fires onSelect with the division', () => {
    const onSelect = vi.fn();
    const { getByText, getByRole } = render(<DivisionCard division={DIV} regState="open" onSelect={onSelect} />);
    expect(getByText('OPEN')).toBeTruthy();
    const btn = getByRole('button');
    expect(btn.disabled).toBe(false);
    fireEvent.click(btn);
    expect(onSelect).toHaveBeenCalledWith(DIV);
  });

  it('closed → CLOSED pill, not interactive', () => {
    const onSelect = vi.fn();
    const { getByText, getByRole } = render(<DivisionCard division={DIV} regState="closed" onSelect={onSelect} />);
    expect(getByText('CLOSED')).toBeTruthy();
    expect(getByRole('button').disabled).toBe(true);
    fireEvent.click(getByRole('button'));
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('upcoming → "OPENS {date}" pill, not interactive', () => {
    const { getByText, getByRole } = render(<DivisionCard division={DIV} regState="upcoming" opensLabel="Feb 24" onSelect={() => {}} />);
    expect(getByText('OPENS Feb 24')).toBeTruthy();
    expect(getByRole('button').disabled).toBe(true);
  });

  it('read-only (no onSelect) is never interactive even when open', () => {
    const { getByRole } = render(<DivisionCard division={DIV} regState="open" />);
    expect(getByRole('button').disabled).toBe(true);
  });

  it('labels "from $X" when the division has add_on fees (#63-money entry honesty)', () => {
    const withAddOn = { ...DIV, fees: [{ fee_type: 'base', amount_cents: 80000 }, { fee_type: 'add_on', amount_cents: 2000 }] };
    const { getByText } = render(<DivisionCard division={withAddOn} regState="open" onSelect={() => {}} />);
    expect(getByText(/from \$800\.00/)).toBeTruthy();
  });

  it('shows the bare base fee (no "from") when there are no add_on fees', () => {
    const { getByText, queryByText } = render(<DivisionCard division={DIV} regState="open" onSelect={() => {}} />);
    expect(getByText(/\$800\.00/)).toBeTruthy();
    expect(queryByText(/from/)).toBeNull();
  });
});

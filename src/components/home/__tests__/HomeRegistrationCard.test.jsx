// @vitest-environment jsdom
//
// H-1 / AP#46 — the admin Home Registration rollup card across its open-program
// faces. Locks: single fee-set shows the program name + stats; single no-fee shows
// the "Set the fee" nudge (never 0·$0·$0); multi shows "Registration · N open" +
// aggregate stats; multi-mixed adds the "needs a fee" nudge. Money renders via
// formatCurrency (the shared source). Tap targets: detail at 1, index at 2+.

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import HomeRegistrationCard from '../HomeRegistrationCard';
import { laneFace } from '../../../lib/home/registrationLane';

afterEach(cleanup);
const future = new Date(Date.now() + 16 * 86400000).toISOString();
const base = { openCount: 1, registered: 8, collectedCents: 36000, dueCents: 8000, soonestCloseAt: future, needsFeeCount: 0 };
const single = (feeSet) => ({ ...base, singleProgram: { id: 'p1', name: 'Fall 2026 Tryouts', program_type: 'tryout', feeSet } });

describe('laneFace (pure)', () => {
  it('maps state to the four faces', () => {
    expect(laneFace({ openCount: 1, singleProgram: { feeSet: true } })).toBe('single_fee');
    expect(laneFace({ openCount: 1, singleProgram: { feeSet: false } })).toBe('single_nofee');
    expect(laneFace({ openCount: 3, needsFeeCount: 0 })).toBe('multi');
    expect(laneFace({ openCount: 3, needsFeeCount: 2 })).toBe('multi_mixed');
  });
});

describe('HomeRegistrationCard', () => {
  it('single + fee set → program name, stats, taps to the detail', () => {
    const onNavigate = vi.fn();
    render(<HomeRegistrationCard data={single(true)} onNavigate={onNavigate} />);
    expect(screen.getByText('Fall 2026 Tryouts')).toBeTruthy();
    expect(screen.getByText('8')).toBeTruthy();
    expect(screen.getByText('$360.00')).toBeTruthy();
    expect(screen.getByText('$80.00')).toBeTruthy();
    expect(screen.queryByText(/no fee set/i)).toBeNull();
    fireEvent.click(screen.getByRole('button'));
    expect(onNavigate).toHaveBeenCalledWith('/admin/programs/p1');
  });

  it('single + NO fee → the Set-the-fee nudge, no stats', () => {
    render(<HomeRegistrationCard data={single(false)} onNavigate={vi.fn()} />);
    expect(screen.getByText(/no fee set/i)).toBeTruthy();
    expect(screen.getByText(/set fee/i)).toBeTruthy();
    expect(screen.queryByText('Registered')).toBeNull(); // never 0·$0·$0
  });

  it('multi, all fee-set → "Registration · N open" + aggregate stats, taps to index', () => {
    const onNavigate = vi.fn();
    render(<HomeRegistrationCard data={{ ...base, openCount: 2, registered: 14, collectedCents: 62000, dueCents: 13500, singleProgram: null }} onNavigate={onNavigate} />);
    expect(screen.getByText('Registration · 2 open')).toBeTruthy();
    expect(screen.getByText(/next closes/i)).toBeTruthy();
    expect(screen.getByText('14')).toBeTruthy();
    fireEvent.click(screen.getByRole('button'));
    expect(onNavigate).toHaveBeenCalledWith('/admin/programs');
  });

  it('multi mixed → aggregate stats PLUS a needs-a-fee nudge', () => {
    render(<HomeRegistrationCard data={{ ...base, openCount: 2, needsFeeCount: 1, singleProgram: null }} onNavigate={vi.fn()} />);
    expect(screen.getByText('Registration · 2 open')).toBeTruthy();
    expect(screen.getByText('8')).toBeTruthy();
    expect(screen.getByText(/program needs/i)).toBeTruthy();
    expect(screen.getByText(/fix/i)).toBeTruthy();
  });
});

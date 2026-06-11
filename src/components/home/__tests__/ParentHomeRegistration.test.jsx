// @vitest-environment jsdom
//
// H-2 / B2 — built to the architect's home-parent-lane render. Two conditional
// sections: "Open for registration" (one program → name + Open badge + "For
// <kids> · closes <date>" + a Register CTA to /r/:slug; 2+ → a count + "View all"
// to My Family) and "Your balance" (a positive family due → "Family balance"
// + "$X due" → My Family). Absent when nothing open AND nothing owed.

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import ParentHomeRegistration from '../ParentHomeRegistration';
import { familyDueCents } from '../../../lib/home/registrationLane';

afterEach(cleanup);
const open1 = { id: 'p1', name: 'Fall 2026 Tryouts', programType: 'tryout', slug: 'fall-2026-tryouts', closesAt: '2026-06-26T23:59:59Z', eligibleChildren: ['Charlie', 'Milo'] };
const bal = (cents, managed = false) => ({ programId: 'p1', programName: 'X', balance: { balance_cents: cents }, managed });

describe('familyDueCents (pure)', () => {
  it('sums positive balances, ignores credits + managed rows', () => {
    expect(familyDueCents([bal(8000), bal(-2000), bal(5000, true), bal(0)])).toBe(8000);
    expect(familyDueCents([])).toBe(0);
  });
});

describe('ParentHomeRegistration (B2 render target)', () => {
  it('renders nothing when nothing open and nothing owed', () => {
    const { container } = render(<ParentHomeRegistration family={{ openPrograms: [], familyBalances: [] }} onNavigate={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it('one open program → name + Open badge + "For <kids> · closes" + Register CTA to /r/:slug', () => {
    render(<ParentHomeRegistration family={{ openPrograms: [open1], familyBalances: [] }} onNavigate={vi.fn()} />);
    expect(screen.getByText('Fall 2026 Tryouts')).toBeTruthy();
    expect(screen.getByText('Open')).toBeTruthy();
    expect(screen.getByText(/For Charlie and Milo · closes Jun 26/)).toBeTruthy();
    const cta = screen.getByRole('link', { name: /register/i });
    expect(cta.getAttribute('href')).toBe('/r/fall-2026-tryouts');
  });

  it('two+ open → count + "View all" to My Family', () => {
    const onNavigate = vi.fn();
    render(<ParentHomeRegistration family={{ openPrograms: [open1, { ...open1, id: 'p2', slug: 's2' }], familyBalances: [] }} onNavigate={onNavigate} />);
    expect(screen.getByText('2 programs open')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /view all/i }));
    expect(onNavigate).toHaveBeenCalledWith('/family');
  });

  it('positive family due → "Family balance" + "$X due" → My Family', () => {
    const onNavigate = vi.fn();
    render(<ParentHomeRegistration family={{ openPrograms: [], familyBalances: [bal(8000)] }} onNavigate={onNavigate} />);
    expect(screen.getByText('Family balance')).toBeTruthy();
    fireEvent.click(screen.getByText('$80.00 due'));
    expect(onNavigate).toHaveBeenCalledWith('/family');
  });
});

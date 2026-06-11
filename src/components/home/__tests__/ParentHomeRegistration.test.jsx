// @vitest-environment jsdom
//
// H-2 — the parent Home registration + balance lane. Conditional: absent when
// nothing is open AND nothing is owed. One open program → a named Register CTA
// (/r/:slug); 2+ → a count CTA to My Family; a positive family due → a "$X due"
// row to My Family. familyDueCents sums only positive, non-managed balances.

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

describe('ParentHomeRegistration', () => {
  it('renders nothing when nothing open and nothing owed', () => {
    const { container } = render(<ParentHomeRegistration family={{ openPrograms: [], familyBalances: [] }} onNavigate={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it('one open program → named Register CTA deep-linking to /r/:slug', () => {
    render(<ParentHomeRegistration family={{ openPrograms: [open1], familyBalances: [] }} onNavigate={vi.fn()} />);
    expect(screen.getByText(/register charlie and milo/i)).toBeTruthy();
    expect(screen.getByText(/Fall 2026 Tryouts · closes Jun 26/)).toBeTruthy();
    expect(screen.getByRole('link').getAttribute('href')).toBe('/r/fall-2026-tryouts');
  });

  it('two+ open → count CTA to My Family', () => {
    const onNavigate = vi.fn();
    render(<ParentHomeRegistration family={{ openPrograms: [open1, { ...open1, id: 'p2', slug: 's2' }], familyBalances: [] }} onNavigate={onNavigate} />);
    fireEvent.click(screen.getByText(/2 programs open to register/i));
    expect(onNavigate).toHaveBeenCalledWith('/family');
  });

  it('positive family due → "$X due" row to My Family', () => {
    const onNavigate = vi.fn();
    render(<ParentHomeRegistration family={{ openPrograms: [], familyBalances: [bal(8000)] }} onNavigate={onNavigate} />);
    fireEvent.click(screen.getByText('$80.00 due'));
    expect(onNavigate).toHaveBeenCalledWith('/family');
  });
});

// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import CoachCompCard from '../CoachCompCard';

afterEach(cleanup);

describe('CoachCompCard', () => {
  it('hides when the coach has no owed + no paid (director — Frank)', () => {
    const { container } = render(<CoachCompCard owedCents={0} paidCents={0} owedSessions={0} hasComp={false} loading={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('hides while loading', () => {
    const { container } = render(<CoachCompCard hasComp loading owedCents={54000} paidCents={0} owedSessions={9} />);
    expect(container.firstChild).toBeNull();
  });

  it('shows owed (with cents) + sessions + paid (Darien: $2,100 owed, 35 sessions, $2,780 paid)', () => {
    const { container } = render(<CoachCompCard owedCents={210000} paidCents={278000} owedSessions={35} hasComp loading={false} />);
    expect(container.textContent).toMatch(/You're owed \$2,100\.00/);
    expect(container.textContent).toMatch(/35 sessions, not yet paid/);
    expect(container.textContent).toMatch(/\$2,780\.00 paid/);
  });

  it('reads "All paid up" when nothing is owed', () => {
    const { container } = render(<CoachCompCard owedCents={0} paidCents={168000} owedSessions={0} hasComp loading={false} />);
    expect(container.textContent).toMatch(/All paid up/);
    expect(container.textContent).not.toMatch(/owed/);
  });
});

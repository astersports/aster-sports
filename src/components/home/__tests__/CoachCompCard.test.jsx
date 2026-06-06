// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import CoachCompCard from '../CoachCompCard';

afterEach(cleanup);

describe('CoachCompCard', () => {
  it('hides when the coach has no payouts (no rate — Kenny/Frank)', () => {
    const { container } = render(<CoachCompCard owedCents={0} paidCents={0} pendingSessions={0} hasComp={false} loading={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('hides while loading', () => {
    const { container } = render(<CoachCompCard hasComp loading owedCents={54000} paidCents={0} pendingSessions={9} />);
    expect(container.firstChild).toBeNull();
  });

  it('shows owed + sessions + paid for a paid coach (Darien: $540 owed, 9 pending, $1,680 paid)', () => {
    const { container } = render(<CoachCompCard owedCents={54000} paidCents={168000} pendingSessions={9} hasComp loading={false} />);
    expect(container.textContent).toMatch(/You're owed \$540/);
    expect(container.textContent).toMatch(/9 sessions pending/);
    expect(container.textContent).toMatch(/\$1,680 paid/);
  });

  it('reads "All paid up" when nothing is owed', () => {
    const { container } = render(<CoachCompCard owedCents={0} paidCents={168000} pendingSessions={0} hasComp loading={false} />);
    expect(container.textContent).toMatch(/All paid up/);
    expect(container.textContent).not.toMatch(/owed/);
  });
});

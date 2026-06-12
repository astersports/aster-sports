// @vitest-environment jsdom
//
// §10.1 glanceable chip row contract (operator directive 2026-06-12):
// going count shows everywhere EXCEPT Hidden-roster contexts for
// parents (tryout/eval — even a headcount is sensitive); staff counts
// are never suppressed (§10.4). Rides/duties chips amber when unfilled,
// quiet/absent when covered (SD-15 non-zero-always-visible).

import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import EventCardChips from '../EventCardChips';

afterEach(cleanup);

const count = { going: 9, denominator: 11 };

describe('EventCardChips — §10.1 row', () => {
  it('parent sees plain going count', () => {
    const { container } = render(<EventCardChips isStaffView={false} count={count} />);
    expect(container.textContent).toContain('9 going');
    expect(container.textContent).not.toContain('rostered');
  });

  it('staff sees the SD-6 denominator form', () => {
    const { container } = render(<EventCardChips isStaffView count={count} />);
    expect(container.textContent).toContain('9 going / 11 rostered');
  });

  it('Hidden roster suppresses the count for parents — lock note instead', () => {
    const { container } = render(<EventCardChips isStaffView={false} suppressCount count={count} />);
    expect(container.textContent).not.toContain('9 going');
    expect(container.textContent).toContain('Counts hidden for evaluations');
  });

  it('Hidden roster never suppresses staff counts (§10.4)', () => {
    const { container } = render(<EventCardChips isStaffView suppressCount count={count} />);
    expect(container.textContent).toContain('9 going / 11 rostered');
  });

  it('rides needed renders when unfilled; Rides covered when offers exist and none needed', () => {
    const a = render(<EventCardChips isStaffView={false} count={count} rideCount={{ requests: 2, offers: 1 }} />);
    expect(a.container.textContent).toContain('2 rides needed');
    cleanup();
    const b = render(<EventCardChips isStaffView={false} count={count} rideCount={{ requests: 0, offers: 3 }} />);
    expect(b.container.textContent).toContain('Rides covered');
  });

  it('volunteer chip only when duties unfilled; own commitment line renders', () => {
    const { container } = render(
      <EventCardChips isStaffView={false} count={count} dutyCount={{ total: 3, claimed: 1 }} commitment="You signed up: snacks" />
    );
    expect(container.textContent).toContain('2 volunteers needed');
    expect(container.textContent).toContain('You signed up: snacks');
    cleanup();
    const covered = render(<EventCardChips isStaffView={false} count={count} dutyCount={{ total: 3, claimed: 3 }} />);
    expect(covered.container.textContent).not.toContain('volunteers needed');
  });
});
